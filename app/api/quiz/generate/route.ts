import { NextResponse } from 'next/server';
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions';

import { getCurrentUserContext } from '@/lib/auth';
import { getProfileById } from '@/lib/data';
import { createGroqChatCompletion } from '@/lib/groq/chat';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { sleep } from '@/lib/utils';
import type { QuizOptionKey } from '@/lib/types/database';

type Category = 'functional' | 'technical';

interface RawQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  marks: number;
}

// Shuffle array in place (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Split array into n roughly equal chunks
function splitIntoGroups<T>(arr: T[], n: number): T[][] {
  const groups: T[][] = Array.from({ length: n }, () => []);
  arr.forEach((item, i) => groups[i % n].push(item));
  return groups;
}

function buildSystemPrompt(category: Category): string {
  if (category === 'functional') {
    return `You are a senior business analyst designing a knowledge-transfer readiness quiz.

Your questions must assess whether the reader can APPLY and ANALYSE knowledge — not just recall facts.
Every question should be scenario-based or decision-based:
- "A stakeholder requests X — what is the correct process / who must approve?"
- "An exception occurs in workflow Y — what is the escalation path?"
- "Team A hands off to Team B — what must be verified before sign-off?"
- "The business rule states Z — which of these situations violates it?"

Focus areas (pick the most relevant from the context provided):
business workflows · process ownership · approval chains · SLA / SLO obligations ·
cross-team handoffs · data ownership · exception handling · access controls ·
compliance requirements · end-user impact

Complexity rules:
- marks=2: application-level (reader must apply a rule to a scenario)
- marks=3: analysis-level (reader must compare trade-offs or diagnose a process failure)
- At least 40 % of questions must be marks=3
- Wrong options must be realistic — a reader who skimmed the docs would pick them

Return ONLY a JSON object. No markdown fences. No commentary outside the JSON.`;
  }

  return `You are a senior solutions architect designing a knowledge-transfer readiness quiz.

Your questions must assess whether the reader can APPLY and ANALYSE technical knowledge — not look up facts.
Every question should be scenario-based or diagnostic:
- "Component A receives request X — trace the data flow and identify the correct outcome"
- "Configuration parameter Y is changed — what breaks and why?"
- "A production alert fires for Z — what is the most likely root cause given the architecture?"
- "The engineer must integrate service A with service B — which approach is correct given the constraints?"

Focus areas (pick the most relevant from the context provided):
system architecture · data models & schemas · API contracts & payload shapes ·
authentication / authorisation mechanisms · deployment topology · integration patterns ·
caching strategies · failure modes & circuit breakers · observability & alerting ·
infrastructure configuration · database query behaviour · technical debt & known constraints

Complexity rules:
- marks=2: application-level (reader applies technical knowledge to a concrete scenario)
- marks=3: analysis-level (reader must diagnose, compare implementations, or reason about failure)
- At least 40 % of questions must be marks=3
- Wrong options must look correct to someone who only half-understands the system

Return ONLY a JSON object. No markdown fences. No commentary outside the JSON.`;
}

function buildUserPrompt(context: string, category: Category, setIndex: number, totalSets: number): string {
  const label = category === 'functional' ? 'Functional' : 'Technical';
  const topicHint = setIndex === 0
    ? 'Cover the foundational concepts introduced early in the documents.'
    : setIndex === totalSets - 1
    ? 'Cover advanced, edge-case, and exception-handling aspects from the documents.'
    : `Cover mid-level concepts from the documents. This is set ${setIndex + 1} of ${totalSets} — do NOT repeat topics or question patterns from the other sets.`;

  return `You are generating Set ${setIndex + 1} of ${totalSets} for a ${label} quiz.
${topicHint}

Generate exactly 10 ${label} multiple-choice questions using ONLY the excerpts below.
Vary the question style — mix scenario, diagnostic, and decision-based formats.
Do not ask trivial "what is the definition of X" questions.

Required JSON shape (return this and nothing else):
{
  "questions": [
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A" | "B" | "C" | "D",
      "explanation": "Why this answer is correct and why the others are wrong.",
      "marks": 2 or 3
    }
  ]
}

KT Document Excerpts (Set ${setIndex + 1} source material):
${context}

Generate 10 questions now.`;
}

function parseQuestions(raw: string): RawQuestion[] {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const list: RawQuestion[] = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    return list
      .filter(
        (q) =>
          q.question_text &&
          q.option_a && q.option_b && q.option_c && q.option_d &&
          ['A', 'B', 'C', 'D'].includes(String(q.correct_option ?? '').toUpperCase()),
      )
      .map((q) => ({ ...q, correct_option: String(q.correct_option).toUpperCase() }));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUserContext();
    const supabase = createServiceRoleSupabaseClient();

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileById(user.id);
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const projectId = String(body.projectId ?? '');
    const category: Category = body.category === 'technical' ? 'technical' : 'functional';
    const numSets = Math.min(5, Math.max(1, Number(body.numSets) || 3));

    // Fetch up to 60 chunks, shuffle them, then split across sets
    const { data: rawChunks } = await supabase
      .from('document_chunks')
      .select('content')
      .eq('project_id', projectId)
      .limit(60);

    if (!rawChunks?.length) {
      return NextResponse.json(
        { error: 'No document content found. Upload and process KT documents first.' },
        { status: 400 },
      );
    }

    // Shuffle so sets get diverse coverage across the whole document corpus
    const shuffled = shuffle(rawChunks);

    // Split into per-set groups so each set is generated from DIFFERENT source material
    const chunkGroups = splitIntoGroups(shuffled, numSets);

    // Find next set_number
    const { data: existingSets } = await supabase
      .from('quiz_sets')
      .select('set_number')
      .eq('project_id', projectId)
      .order('set_number', { ascending: false })
      .limit(1);

    const startSetNumber = ((existingSets?.[0]?.set_number as number) ?? 0) + 1;
    const categoryLabel = category === 'functional' ? 'Functional' : 'Technical';
    const systemPrompt = buildSystemPrompt(category);

    let createdSets = 0;
    let createdQuestions = 0;

    for (let i = 0; i < numSets; i++) {
      if (i > 0) await sleep(3000);

      // Build context from this set's unique chunk group (truncate each chunk to keep tokens down)
      const context = (chunkGroups[i] ?? chunkGroups[0])
        .map((c) => c.content.slice(0, 500).trim())
        .join('\n---\n');

      const userPrompt = buildUserPrompt(context, category, i, numSets);

      let questions: RawQuestion[] = [];

      try {
        const completion = await createGroqChatCompletion({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
          max_tokens: 3500,
        }) as ChatCompletion;

        const raw = completion?.choices?.[0]?.message?.content ?? '{}';
        questions = parseQuestions(raw);
      } catch (err) {
        if (i === 0) {
          const msg = err instanceof Error ? err.message : 'AI generation failed';
          return NextResponse.json({ error: msg }, { status: 500 });
        }
        continue;
      }

      if (!questions.length) continue;

      const setNumber = startSetNumber + i;
      const { data: newSet, error: setError } = await supabase
        .from('quiz_sets')
        .insert({
          project_id: projectId,
          set_name: `${categoryLabel} Set ${setNumber}`,
          set_number: setNumber,
          is_active: true,
        })
        .select('id')
        .single();

      if (setError || !newSet) continue;

      const rows = questions.map((q) => ({
        quiz_set_id: newSet.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option as QuizOptionKey,
        explanation: q.explanation || null,
        marks: q.marks === 3 ? 3 : 2,
      }));

      const { error: qError } = await supabase.from('quiz_questions').insert(rows);
      if (!qError) {
        createdSets++;
        createdQuestions += rows.length;
      }
    }

    if (createdSets === 0) {
      return NextResponse.json(
        { error: 'No sets were created. The AI may have returned unusable output — please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ createdSets, createdQuestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
