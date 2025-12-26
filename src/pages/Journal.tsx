import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { JournalCard } from '@/components/journal/JournalCard';
import { Button } from '@/components/ui/button';
import { getJournals, deleteJournal } from '@/lib/storage';
import { Plus, PenLine, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Journal() {
  const { toast } = useToast();
  const [journals, setJournals] = useState(() => 
    getJournals().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  const handleDeleteJournal = (id: string, title: string) => {
    deleteJournal(id);
    setJournals(prev => prev.filter(j => j.id !== id));
    toast({
      title: "日记已删除",
      description: `"${title || '无标题'}" 已被删除`,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">日记</h1>
            <p className="text-muted-foreground mt-1">记录思考，与 AI 对话成长</p>
          </div>
          <Link to="/journal/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              写日记
            </Button>
          </Link>
        </div>

        {journals.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 mx-auto mb-6 flex items-center justify-center">
              <PenLine className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">开始记录你的想法</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              写下你的日记，AI 会帮助你挖掘更深层的思考，获得成长建议
            </p>
            <Link to="/journal/new">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                写第一篇日记
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {journals.map(journal => (
              <div key={journal.id} className="relative group">
                <JournalCard journal={journal} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除日记？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作将永久删除该日记及其所有对话记录，无法恢复。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteJournal(journal.id, journal.title)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}