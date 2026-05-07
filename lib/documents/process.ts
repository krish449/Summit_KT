import 'server-only';

import { chunkDocumentText } from '@/lib/rag/chunking';
import { embedText } from '@/lib/rag/embeddings';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export async function processDocumentRecord(documentId: string, projectId: string, content: string) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase service role is not configured.');
  }

  const chunks = chunkDocumentText(content);
  const embeddings = await Promise.all(chunks.map((chunk) => embedText(chunk.content)));

  const payload = chunks.map((chunk, index) => ({
    document_id: documentId,
    project_id: projectId,
    content: chunk.content,
    chunk_index: chunk.chunkIndex,
    embedding: embeddings[index],
  }));

  if (payload.length) {
    const { error: insertError } = await supabase.from('document_chunks').insert(payload);

    if (insertError) {
      throw insertError;
    }
  }

  const { error: updateError } = await supabase
    .from('documents')
    .update({ chunk_count: payload.length })
    .eq('id', documentId);

  if (updateError) {
    throw updateError;
  }

  return payload.length;
}