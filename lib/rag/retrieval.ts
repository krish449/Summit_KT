import 'server-only';

import { embedText } from '@/lib/rag/embeddings';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export interface RetrievedChunk {
  id: string;
  content: string;
  document_id: string;
  document_name: string;
  similarity: number;
}

export async function retrieveRelevantChunks(projectId: string, query: string, limit = 5) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return [] as RetrievedChunk[];
  }

  const embedding = await embedText(query);
  const { data, error } = await supabase.rpc('match_document_chunks', {
    filter_project_id: projectId,
    query_embedding: embedding,
    match_count: limit,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as RetrievedChunk[];
}