import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { getJournal, saveJournal, generateId, ChatMessage } from '@/lib/storage';
import { ArrowLeft, PenLine } from 'lucide-react';

export default function JournalChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(() => getJournal(id!));
  const [isLoading, setIsLoading] = useState(false);

  if (!journal) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">日记不存在</h1>
          <Link to="/journal">
            <Button>返回日记列表</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedJournal = {
      ...journal,
      messages: [...journal.messages, userMessage],
    };
    setJournal(updatedJournal);
    saveJournal(updatedJournal);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: generateJournalResponse(content, journal.content),
      timestamp: new Date().toISOString(),
    };

    const finalJournal = {
      ...updatedJournal,
      messages: [...updatedJournal.messages, assistantMessage],
    };
    setJournal(finalJournal);
    saveJournal(finalJournal);
    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-73px-80px)] md:h-[calc(100vh-73px)] flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/journal/${journal.id}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">
                {journal.title || '无标题'}
              </h1>
              <p className="text-xs text-muted-foreground">
                与 AI 对话
              </p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/journal/${journal.id}`)}
          >
            <PenLine className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">编辑日记</span>
          </Button>
        </div>

        {/* Journal Preview */}
        <div className="bg-muted/30 border-b border-border px-4 py-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {journal.content.substring(0, 200)}...
          </p>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={journal.messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="与 AI 探讨你的日记..."
          />
        </div>
      </div>
    </AppLayout>
  );
}

function generateJournalResponse(userInput: string, journalContent: string): string {
  const responses = [
    `从你的日记中，我感受到了你对这件事的深入思考。你提到的这个点让我很好奇：是什么让你产生了这样的感受？`,
    `这是一个很有意义的反思。让我们更深入地探讨一下：如果换一个角度来看这件事，你会发现什么不同？`,
    `你的坦诚让我很感动。在这个过程中，你觉得自己学到了什么？这对你未来会有什么影响？`,
    `我注意到你日记中提到的这一点。你觉得这个经历对你的成长有什么意义？`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
