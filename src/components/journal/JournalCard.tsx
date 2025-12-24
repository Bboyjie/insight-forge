import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle, Calendar } from 'lucide-react';
import { JournalEntry } from '@/lib/storage';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface JournalCardProps {
  journal: JournalEntry;
}

export function JournalCard({ journal }: JournalCardProps) {
  const hasMessages = journal.messages && journal.messages.length > 0;

  return (
    <Link 
      to={`/journal/${journal.id}`}
      className="block bg-card border border-border p-6 hover:border-primary transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {journal.title || '无标题'}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {journal.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {format(new Date(journal.createdAt), 'yyyy年M月d日', { locale: zhCN })}
          </span>
        </div>
        {hasMessages && (
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{journal.messages.length} 条对话</span>
          </div>
        )}
      </div>
    </Link>
  );
}
