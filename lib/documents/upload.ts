import 'server-only';

import { randomUUID } from 'crypto';

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export async function uploadDocumentToStorage(projectId: string, file: File) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase service role is not configured.');
  }

  const extension = file.name.split('.').pop() ?? 'bin';
  const path = `${projectId}/${randomUUID()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage.from('documents').upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
}