import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { getProject, saveProject, generateId, ChatMessage } from '@/lib/storage';
import { ArrowLeft, CheckCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Learning() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(() => getProject(projectId!));
  const [isLoading, setIsLoading] = useState(false);

  const chapter = project?.chapters.find(c => c.id === chapterId);

  if (!project || !chapter) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">章节不存在</h1>
          <Link to="/projects">
            <Button>返回项目列表</Button>
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

    // Update project with user message
    const updatedChapters = project.chapters.map(c =>
      c.id === chapterId
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    );
    
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    saveProject(updatedProject);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000));

    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: generateMockResponse(content, chapter.title),
      timestamp: new Date().toISOString(),
    };

    const finalChapters = updatedProject.chapters.map(c =>
      c.id === chapterId
        ? { ...c, messages: [...c.messages, assistantMessage] }
        : c
    );

    const finalProject = { ...updatedProject, chapters: finalChapters };
    setProject(finalProject);
    saveProject(finalProject);
    setIsLoading(false);
  };

  const handleResetChat = () => {
    const updatedChapters = project.chapters.map(c =>
      c.id === chapterId ? { ...c, messages: [] } : c
    );
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    saveProject(updatedProject);
    toast({
      title: "对话已重置",
      description: "你可以重新开始学习这个章节",
    });
  };

  const handleCompleteChapter = () => {
    const updatedChapters = project.chapters.map(c =>
      c.id === chapterId ? { ...c, completed: true } : c
    );
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    saveProject(updatedProject);
    toast({
      title: "章节完成！",
      description: "继续保持，你正在取得进步！",
    });
    navigate(`/projects/${projectId}`);
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
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">
                {chapter.title}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                {project.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleResetChat}>
              <RotateCcw className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">重置</span>
            </Button>
            <Button size="sm" onClick={handleCompleteChapter}>
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">完成本章</span>
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={chapter.messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="输入你的问题或想法..."
          />
        </div>
      </div>
    </AppLayout>
  );
}

function generateMockResponse(userInput: string, chapterTitle: string): string {
  const responses = [
    `这是一个很好的问题！让我们一起来思考：在学习"${chapterTitle}"的过程中，你觉得最核心的概念是什么？为什么这个概念如此重要？`,
    `我注意到你提到了"${userInput.substring(0, 20)}..."。这让我想到一个问题：你能举一个生活中的例子来说明这个概念吗？`,
    `你的理解非常到位！让我们更深入一步：如果我们从另一个角度来看这个问题，会得出什么不同的结论？`,
    `很棒的思考！在继续之前，让我问你：这个概念与我们之前讨论的内容有什么联系？`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
