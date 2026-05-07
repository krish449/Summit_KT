import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { deleteDocumentAction } from '@/app/actions/admin';
import { DocumentUploadPanel } from '@/components/admin/document-upload-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProjectById, getProjectDocuments } from '@/lib/data';
import { formatDate } from '@/lib/utils';

export default async function ProjectDocumentsPage({ params }: { params: { id: string } }) {
  const [project, documents] = await Promise.all([
    getProjectById(params.id),
    getProjectDocuments(params.id),
  ]);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/admin/projects" className="transition hover:text-slate-900">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/admin/projects/${params.id}`} className="transition hover:text-slate-900">{project?.name ?? 'Project'}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-900">Documents</span>
      </nav>
      <DocumentUploadPanel projectId={params.id} />

      <Card>
        <CardHeader>
          <CardTitle>Uploaded documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length ? (
            documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-900">{document.file_name}</p>
                    <Badge variant="info">{document.file_type.toUpperCase()}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Uploaded {formatDate(document.uploaded_at, true)} • {document.chunk_count} chunks</p>
                </div>
                <form action={deleteDocumentAction}>
                  <input name="project_id" type="hidden" value={params.id} />
                  <input name="document_id" type="hidden" value={document.id} />
                  <input name="file_url" type="hidden" value={document.file_url} />
                  <Button type="submit" variant="danger">Delete</Button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}