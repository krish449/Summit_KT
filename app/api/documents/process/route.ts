import { NextResponse } from 'next/server';

import { getCurrentUserContext } from '@/lib/auth';
import { getProfileById } from '@/lib/data';
import { extractTextFromFile } from '@/lib/documents/parse';
import { processDocumentRecord } from '@/lib/documents/process';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

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

    const body = (await request.json()) as { documentId: string; projectId: string };
    const { data: document, error } = await supabase.from('documents').select('*').eq('id', body.documentId).maybeSingle();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage.from('documents').download(document.file_url);

    if (downloadError || !fileData) {
      throw downloadError ?? new Error('Unable to download file from storage.');
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const content = await extractTextFromFile(document.file_name, buffer);
    const chunkCount = await processDocumentRecord(body.documentId, body.projectId, content);

    return NextResponse.json({ chunkCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Processing failed' }, { status: 500 });
  }
}