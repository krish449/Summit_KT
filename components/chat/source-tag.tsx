import { Badge } from '@/components/ui/badge';

export function SourceTag({ documentName }: { documentName: string }) {
  return <Badge variant="info">Source: {documentName}</Badge>;
}