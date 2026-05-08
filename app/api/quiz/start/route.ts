import { NextResponse } from 'next/server';

import { getCurrentUserContext } from '@/lib/auth';
import { getProfileById, getProjectById, getProjectMembers, logActivity, userHasProjectAccess } from '@/lib/data';
import { checkRateLimit } from '@/lib/rate-limit';
import { createSectionedQuestions } from '@/lib/quiz/assignment';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import type { AssignedQuestion, QuizQuestionRecord, QuizSetRecord } from '@/lib/types/database';

const QUESTIONS_PER_SECTION = 20;
const SECTION_DURATION_SECONDS = 900; // 15 min

function toClientQuestions(questions: AssignedQuestion[]) {
  return questions.map((q) => ({
    questionId: q.questionId,
    questionText: q.questionText,
    options: q.options,
  }));
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUserContext();
    const supabase = createServiceRoleSupabaseClient();

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileById(user.id);
    const { projectId } = (await request.json()) as { projectId: string };

    if (!profile || profile.role !== 'member') {
      return NextResponse.json({ error: 'Admins cannot take quizzes.' }, { status: 403 });
    }

    const canAccess = await userHasProjectAccess(user.id, profile.role, projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limit: max 5 quiz starts per hour
    const rateCheck = await checkRateLimit(user.id, 'quiz_started', 5, 3600);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many quiz attempts. Please wait before trying again.' }, { status: 429 });
    }

    // Already submitted — return the locked attempt
    const { data: submittedAttempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('status', 'submitted')
      .maybeSingle();

    if (submittedAttempt) {
      return NextResponse.json({ error: 'Quiz already submitted.', attempt: submittedAttempt }, { status: 403 });
    }

    // Resume a valid in_progress attempt that has the new sectioned format
    const { data: inProgressAttempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (inProgressAttempt) {
      const saved = inProgressAttempt.assigned_questions as AssignedQuestion[];

      if (saved?.length && saved[0]?.section) {
        // New sectioned format — resume
        const functional = saved.filter((q) => q.section === 'functional');
        const technical = saved.filter((q) => q.section === 'technical');
        return NextResponse.json({
          attemptId: inProgressAttempt.id,
          sections: [
            { name: 'Functional', durationSeconds: SECTION_DURATION_SECONDS, questions: toClientQuestions(functional) },
            { name: 'Technical',  durationSeconds: SECTION_DURATION_SECONDS, questions: toClientQuestions(technical) },
          ],
        });
      }

      // Old format or empty — delete and start fresh
      await supabase.from('quiz_attempts').delete().eq('id', inProgressAttempt.id);
    }

    // Check quiz window
    const { data: projectWindow } = await supabase
      .from('projects')
      .select('quiz_open_at, quiz_close_at')
      .eq('id', projectId)
      .maybeSingle();

    const now = new Date();
    if (projectWindow?.quiz_open_at && new Date(projectWindow.quiz_open_at) > now) {
      return NextResponse.json(
        { error: 'Quiz has not opened yet.', opensAt: projectWindow.quiz_open_at },
        { status: 403 },
      );
    }
    if (projectWindow?.quiz_close_at && new Date(projectWindow.quiz_close_at) < now) {
      return NextResponse.json(
        { error: 'The quiz window has closed.', closedAt: projectWindow.quiz_close_at },
        { status: 403 },
      );
    }

    // Load all active sets for this project
    const { data: sets } = await supabase
      .from('quiz_sets')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('set_number', { ascending: true });

    if (!sets?.length) {
      return NextResponse.json({ error: 'No quiz sets have been created for this project yet.' }, { status: 400 });
    }

    const typedSets = sets as QuizSetRecord[];
    const functionalSets = typedSets.filter((s) => s.set_name.toLowerCase().includes('functional'));
    const technicalSets  = typedSets.filter((s) => s.set_name.toLowerCase().includes('technical'));

    if (!functionalSets.length || !technicalSets.length) {
      const missing = !functionalSets.length ? 'Functional' : 'Technical';
      return NextResponse.json(
        { error: `No ${missing} quiz sets found. Ask your admin to generate ${missing} questions first.` },
        { status: 400 },
      );
    }

    // Fetch ALL questions from ALL sets in each category
    const [{ data: rawFunctional }, { data: rawTechnical }] = await Promise.all([
      supabase.from('quiz_questions').select('*').in('quiz_set_id', functionalSets.map((s) => s.id)),
      supabase.from('quiz_questions').select('*').in('quiz_set_id', technicalSets.map((s) => s.id)),
    ]);

    if (!rawFunctional?.length) {
      return NextResponse.json(
        { error: 'Functional sets have no questions yet. Ask your admin to add questions.' },
        { status: 400 },
      );
    }
    if (!rawTechnical?.length) {
      return NextResponse.json(
        { error: 'Technical sets have no questions yet. Ask your admin to add questions.' },
        { status: 400 },
      );
    }

    // Create sectioned, shuffled, limited question sets
    const functionalAssigned = createSectionedQuestions(
      rawFunctional as QuizQuestionRecord[], 'functional', QUESTIONS_PER_SECTION,
    );
    const technicalAssigned = createSectionedQuestions(
      rawTechnical as QuizQuestionRecord[], 'technical', QUESTIONS_PER_SECTION,
    );

    const allAssigned = [...functionalAssigned, ...technicalAssigned];

    const [members, project] = await Promise.all([
      getProjectMembers(projectId),
      getProjectById(projectId),
    ]);

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        project_id: projectId,
        quiz_set_id: functionalSets[0].id,
        assigned_questions: allAssigned,
        answers_given: {},
        status: 'in_progress',
      })
      .select('*')
      .single();

    if (error) throw error;

    await logActivity({
      userId: user.id,
      projectId,
      action: 'quiz_started',
      metadata: {
        functionalSet: functionalSets[0].set_name,
        technicalSet: technicalSets[0].set_name,
        threshold: project?.pass_threshold ?? 60,
        totalMembers: members.length,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      sections: [
        { name: 'Functional', durationSeconds: SECTION_DURATION_SECONDS, questions: toClientQuestions(functionalAssigned) },
        { name: 'Technical',  durationSeconds: SECTION_DURATION_SECONDS, questions: toClientQuestions(technicalAssigned) },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quiz start failed' },
      { status: 500 },
    );
  }
}
