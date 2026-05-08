'use server';

import { revalidatePath } from 'next/cache';
import { parse } from 'csv-parse/sync';

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

function getAdminSupabase() {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase service role is not configured.');
  }

  return supabase;
}

export async function createProjectAction(formData: FormData) {
  const supabase = getAdminSupabase();

  const payload = {
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    created_by: String(formData.get('created_by') ?? ''),
    is_active: true,
    pass_threshold: Number(formData.get('pass_threshold') ?? 60),
  };

  await supabase.from('projects').insert(payload);
  revalidatePath('/admin/projects');
}

export async function toggleProjectStatusAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const projectId = String(formData.get('project_id') ?? '');
  const nextState = String(formData.get('next_state') ?? 'true') === 'true';

  await supabase.from('projects').update({ is_active: nextState }).eq('id', projectId);
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const documentId = String(formData.get('document_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  const storagePath = String(formData.get('file_url') ?? '');

  if (storagePath) {
    await supabase.storage.from('documents').remove([storagePath]);
  }

  await supabase.from('documents').delete().eq('id', documentId);
  await supabase.from('document_chunks').delete().eq('document_id', documentId);

  revalidatePath(`/admin/projects/${projectId}/documents`);
}

export async function inviteProjectMemberAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') ?? '').trim();
  const projectId = String(formData.get('project_id') ?? '');

  if (!email || !projectId) {
    return;
  }

  const { data: existingProfile } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  let userId = existingProfile?.id as string | undefined;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` : undefined,
      data: {
        full_name: fullName,
      },
    });

    if (error) {
      throw error;
    }

    userId = data.user.id;
    await supabase.from('users').upsert({
      id: userId,
      email,
      full_name: fullName || null,
      role: 'member',
      is_active: true,
    });
  }

  await supabase.from('project_members').upsert({ project_id: projectId, user_id: userId });
  revalidatePath(`/admin/projects/${projectId}/members`);
}

export async function removeProjectMemberAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const userId = String(formData.get('user_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');

  await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId);
  revalidatePath(`/admin/projects/${projectId}/members`);
}

const MAX_QUIZ_RESETS = 2;

export async function resetQuizAttemptAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const attemptId = String(formData.get('attempt_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  const userId = String(formData.get('user_id') ?? '');
  const reason = String(formData.get('reason') ?? '').trim() || 'Reset by admin';
  const resetBy = String(formData.get('reset_by') ?? '');

  // Enforce max reset limit
  const { count } = await supabase
    .from('quiz_resets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('project_id', projectId);

  if ((count ?? 0) >= MAX_QUIZ_RESETS) {
    return;
  }

  await supabase.from('quiz_attempts').delete().eq('id', attemptId);
  await supabase.from('quiz_resets').insert({
    user_id: userId,
    project_id: projectId,
    reset_by: resetBy || null,
    reason,
  });

  revalidatePath(`/admin/projects/${projectId}/analytics`);
}

export async function setQuizWindowAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const projectId = String(formData.get('project_id') ?? '');
  const openAtRaw = (formData.get('quiz_open_at') as string | null) || '';
  const closeAtRaw = (formData.get('quiz_close_at') as string | null) || '';

  await supabase
    .from('projects')
    .update({
      quiz_open_at: openAtRaw ? new Date(openAtRaw).toISOString() : null,
      quiz_close_at: closeAtRaw ? new Date(closeAtRaw).toISOString() : null,
    })
    .eq('id', projectId);

  revalidatePath(`/admin/projects/${projectId}/analytics`);
  revalidatePath(`/projects/${projectId}/quiz`);
}

export async function deleteQuizSetAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const setId = String(formData.get('set_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');

  await supabase.from('quiz_questions').delete().eq('quiz_set_id', setId);
  await supabase.from('quiz_sets').delete().eq('id', setId);
  revalidatePath(`/admin/projects/${projectId}/quiz`);
}

export async function deleteQuizQuestionAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const questionId = String(formData.get('question_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');

  await supabase.from('quiz_questions').delete().eq('id', questionId);
  revalidatePath(`/admin/projects/${projectId}/quiz`);
}

export async function createQuizSetAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const projectId = String(formData.get('project_id') ?? '');
  const setName = String(formData.get('set_name') ?? '');
  const setNumber = Number(formData.get('set_number') ?? 1);

  await supabase.from('quiz_sets').insert({
    project_id: projectId,
    set_name: setName,
    set_number: setNumber,
    is_active: true,
  });

  revalidatePath(`/admin/projects/${projectId}/quiz`);
}

export async function createQuizQuestionAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const projectId = String(formData.get('project_id') ?? '');
  const quizSetId = String(formData.get('quiz_set_id') ?? '');

  await supabase.from('quiz_questions').insert({
    quiz_set_id: quizSetId,
    question_text: String(formData.get('question_text') ?? ''),
    option_a: String(formData.get('option_a') ?? ''),
    option_b: String(formData.get('option_b') ?? ''),
    option_c: String(formData.get('option_c') ?? ''),
    option_d: String(formData.get('option_d') ?? ''),
    correct_option: String(formData.get('correct_option') ?? 'A'),
    explanation: String(formData.get('explanation') ?? ''),
    marks: Number(formData.get('marks') ?? 1),
  });

  revalidatePath(`/admin/projects/${projectId}/quiz`);
}

export async function importQuizCsvAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const projectId = String(formData.get('project_id') ?? '');
  const quizSetId = String(formData.get('quiz_set_id') ?? '');
  const csvText = String(formData.get('csv_text') ?? '');

  if (!csvText.trim()) {
    return;
  }

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  if (!rows.length) {
    return;
  }

  await supabase.from('quiz_questions').insert(
    rows.map((row) => ({
      quiz_set_id: quizSetId,
      question_text: row.question_text,
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      option_d: row.option_d,
      correct_option: row.correct_option,
      explanation: row.explanation,
      marks: Number(row.marks ?? 1),
    })),
  );

  revalidatePath(`/admin/projects/${projectId}/quiz`);
}

export async function createDemoUserAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const projectId = String(formData.get('project_id') ?? '').trim();

  const DEMO_EMAIL = 'demo@summit.app';
  const DEMO_PASSWORD = 'Demo@Summit1';
  const DEMO_NAME = 'Demo Member';

  // Check if already exists
  const { data: existing } = await supabase.from('users').select('id').eq('email', DEMO_EMAIL).maybeSingle();
  let userId = existing?.id as string | undefined;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });

    if (error) throw error;
    userId = data.user.id;

    await supabase.from('users').upsert({
      id: userId,
      email: DEMO_EMAIL,
      full_name: DEMO_NAME,
      role: 'member',
      is_active: true,
    });
  }

  if (projectId && userId) {
    await supabase.from('project_members').upsert({ project_id: projectId, user_id: userId });
  }

  revalidatePath('/admin/users');
}

export async function updateUserRoleAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const userId = String(formData.get('user_id') ?? '');
  const role = String(formData.get('role') ?? 'member');

  await supabase.from('users').update({ role }).eq('id', userId);
  revalidatePath('/admin/users');
}

export async function toggleUserActiveAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const userId = String(formData.get('user_id') ?? '');
  const nextState = String(formData.get('next_state') ?? 'true') === 'true';

  await supabase.from('users').update({ is_active: nextState }).eq('id', userId);
  revalidatePath('/admin/users');
}