import { NextResponse } from 'next/server';

import { getCurrentUserContext } from '@/lib/auth';
import { getProfileById, getProjectById, logActivity } from '@/lib/data';
import { scoreQuizSubmission } from '@/lib/quiz/scoring';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import type { AssignedQuestion, QuizOptionKey } from '@/lib/types/database';

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUserContext();
    const supabase = createServiceRoleSupabaseClient();

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getProfileById(user.id);

    if (!profile || profile.role !== 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      projectId: string;
      attemptId: string;
      answers: Record<string, QuizOptionKey>;
    };

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', body.attemptId)
      .eq('user_id', user.id)
      .eq('project_id', body.projectId)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 });
    }

    if (attempt.status === 'submitted') {
      return NextResponse.json({ error: 'Quiz already submitted' }, { status: 403 });
    }

    const assignedQuestions = attempt.assigned_questions as AssignedQuestion[];
    const assignedIds = new Set(assignedQuestions.map((question) => question.questionId));
    const answerIds = Object.keys(body.answers);

    if (answerIds.some((id) => !assignedIds.has(id))) {
      return NextResponse.json({ error: 'Invalid question set submitted' }, { status: 400 });
    }

    const project = await getProjectById(body.projectId);
    const scored = scoreQuizSubmission(assignedQuestions, body.answers, project?.pass_threshold ?? 60);

    await supabase
      .from('quiz_attempts')
      .update({
        answers_given: body.answers,
        score: scored.score,
        total_marks: scored.totalMarks,
        percentage: scored.percentage,
        passed: scored.passed,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .eq('id', body.attemptId);

    await logActivity({ userId: user.id, projectId: body.projectId, action: 'quiz_submitted', metadata: { score: scored.score, percentage: scored.percentage } });

    return NextResponse.json({
      score: scored.score,
      totalMarks: scored.totalMarks,
      percentage: scored.percentage,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quiz submission failed' }, { status: 500 });
  }
}