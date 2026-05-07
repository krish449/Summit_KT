import { SourceTag } from '@/components/chat/source-tag';
import { cn } from '@/lib/utils';

export interface ChatBubbleMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ documentName: string }> | null;
}

export function MessageBubble({ message }: { message: ChatBubbleMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-3xl rounded-3xl px-5 py-4 shadow-sm', isUser ? 'bg-brand-700 text-white' : 'bg-white text-slate-900')}>
        <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
        {!isUser && message.sources?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.sources.map((source, index) => (
              <SourceTag key={`${source.documentName}-${index}`} documentName={source.documentName} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}