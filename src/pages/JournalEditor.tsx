import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getJournal, saveJournal, deleteJournal, generateId, JournalEntry } from '@/lib/storage';
import { ArrowLeft, Save, Trash2, MessageCircle } from 'lucide-react';
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

export default function JournalEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [journal, setJournal] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const existingJournal = getJournal(id);
      if (existingJournal) {
        setJournal(existingJournal);
        setTitle(existingJournal.title);
        setContent(existingJournal.content);
      }
    }
  }, [id, isNew]);

  const handleSave = () => {
    const now = new Date().toISOString();
    const journalEntry: JournalEntry = {
      id: journal?.id || generateId(),
      title: title || '无标题',
      content,
      createdAt: journal?.createdAt || now,
      updatedAt: now,
      messages: journal?.messages || [],
    };

    saveJournal(journalEntry);
    toast({
      title: "保存成功",
      description: "日记已保存",
    });

    if (isNew) {
      navigate(`/journal/${journalEntry.id}`, { replace: true });
    }
    setJournal(journalEntry);
  };

  const handleDelete = () => {
    if (journal) {
      deleteJournal(journal.id);
      toast({
        title: "日记已删除",
      });
    }
    navigate('/journal');
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/journal')}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>

          <div className="flex items-center gap-2">
            {journal && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/journal/${journal.id}/chat`)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                对话
              </Button>
            )}
            
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button onClick={handleSave} disabled={!content.trim()}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="日记标题（可选）"
            className="text-2xl font-bold border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天想写点什么..."
            className="min-h-[400px] resize-none border-0 focus-visible:ring-0 text-lg leading-relaxed"
          />
        </div>
      </div>
    </AppLayout>
  );
}
