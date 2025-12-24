import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { getJournal, saveJournal, generateId, ChatMessage, getLLMSettings } from '@/lib/storage';
import { ArrowLeft, PenLine, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const JOURNAL_COMPANION_PROMPT = `你是一个温暖、睿智的生活教练和心灵伙伴。

核心原则：
1. 仔细阅读和理解用户的日记内容
2. 提出引发深度思考的问题，帮助用户探索内心
3. 给予情绪上的支持和共情
4. 提供关于个人成长的建议
5. 不要说教，而是以朋友的身份陪伴
6. 帮助用户发现自己的优点和成长空间

你的回复应该真诚、温暖，既能提供情绪价值，也能引导深度反思。`;

export default function JournalChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journal, setJournal] = useState(() => getJournal(id!));
  const [isLoading, setIsLoading] = useState(false);

  const settings = getLLMSettings();

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

    try {
      // Check if LLM is configured
      if (!settings?.baseUrl || !settings?.apiKey || !settings?.modelName) {
        throw new Error('请先在设置页面配置 LLM API');
      }

      // Build messages for LLM
      const historyMessages = updatedJournal.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = `${JOURNAL_COMPANION_PROMPT}

用户的日记内容：
---
标题：${journal.title || '无标题'}
内容：${journal.content}
---

请基于以上日记内容与用户进行对话。`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: historyMessages,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          modelName: settings.modelName,
          systemPrompt,
          stream: false,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantContent = data.choices?.[0]?.message?.content || '抱歉，我暂时无法回应。请稍后再试。';

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      const finalJournal = {
        ...updatedJournal,
        messages: [...updatedJournal.messages, assistantMessage],
      };
      setJournal(finalJournal);
      saveJournal(finalJournal);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '请求失败';
      toast({
        title: "AI 回复失败",
        description: errorMessage,
        variant: "destructive",
      });

      // Add error message as assistant response
      const errorAssistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `抱歉，发生了错误：${errorMessage}`,
        timestamp: new Date().toISOString(),
      };

      const errorJournal = {
        ...updatedJournal,
        messages: [...updatedJournal.messages, errorAssistantMessage],
      };
      setJournal(errorJournal);
      saveJournal(errorJournal);
    } finally {
      setIsLoading(false);
    }
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

        {/* API Warning */}
        {!settings && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              请先在 <Link to="/settings" className="underline">设置页面</Link> 配置 LLM API
            </span>
          </div>
        )}

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
