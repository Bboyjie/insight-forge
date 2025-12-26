import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { getProject, saveProject, generateId, ChatMessage, getLLMSettings, getUserProfile, saveUserProfile, SubChapter } from '@/lib/storage';
import { ArrowLeft, CheckCircle, RotateCcw, AlertCircle, Target, ChevronDown, ChevronRight, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const SOCRATIC_PROMPT = `你是一位启发式导师，采用苏格拉底式教学法，以学习目标为导向进行教学。

核心原则：
1. 以学习目标为导向，确保学生朝着目标前进
2. 不要直接给出答案或长篇大论
3. 通过提问引导学生思考
4. 如果学生回答正确，给予肯定并深入探索
5. 如果学生回答错误，温柔引导，不要直接否定
6. 使用类比和例子帮助理解
7. 鼓励学生自己发现答案
8. 定期检查学生对学习目标的掌握程度
9. 在适当时候总结学生已经达成的目标

你的回复应该简洁，通常是1-3个引导性问题或简短的启发。在开始对话时，可以先帮助学生了解本节的学习目标。`;

export default function Learning() {
  const { projectId, chapterId, subChapterId } = useParams<{ projectId: string; chapterId: string; subChapterId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(() => getProject(projectId!));
  const [isLoading, setIsLoading] = useState(false);
  const [showObjectives, setShowObjectives] = useState(true);

  const chapter = project?.chapters.find(c => c.id === chapterId);
  const subChapter = subChapterId ? chapter?.subChapters?.find(s => s.id === subChapterId) : null;
  const settings = getLLMSettings();

  // Determine current learning target (subChapter if specified, otherwise chapter)
  const currentTarget = subChapter || chapter;
  const messages = subChapter ? subChapter.messages : chapter?.messages || [];

  if (!project || !chapter) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">内容不存在</h1>
          <Link to="/projects">
            <Button>返回项目列表</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (subChapterId && !subChapter) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">子章节不存在</h1>
          <Link to={`/projects/${projectId}`}>
            <Button>返回项目详情</Button>
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
    const updatedChapters = project.chapters.map(c => {
      if (c.id !== chapterId) return c;
      
      if (subChapterId) {
        return {
          ...c,
          subChapters: c.subChapters?.map(s =>
            s.id === subChapterId
              ? { ...s, messages: [...s.messages, userMessage] }
              : s
          ),
        };
      } else {
        return { ...c, messages: [...c.messages, userMessage] };
      }
    });
    
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    saveProject(updatedProject);

    try {
      // Check if LLM is configured
      if (!settings?.baseUrl || !settings?.apiKey || !settings?.modelName) {
        throw new Error('请先在设置页面配置 LLM API');
      }

      // Build messages for LLM
      const currentMessages = subChapterId
        ? updatedChapters.find(c => c.id === chapterId)?.subChapters?.find(s => s.id === subChapterId)?.messages
        : updatedChapters.find(c => c.id === chapterId)?.messages;
      
      const historyMessages = currentMessages?.map(m => ({
        role: m.role,
        content: m.content,
      })) || [];

      // Build objectives context
      const targetObjectives = currentTarget?.objectives || [];
      const objectivesText = targetObjectives.length 
        ? targetObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')
        : '无具体目标';

      const systemPrompt = `${SOCRATIC_PROMPT}

当前学习内容：
- 项目：${project.title}
- 章节：${chapter.title}
${subChapter ? `- 子章节：${subChapter.title}` : ''}
- 描述：${currentTarget?.description || ''}

本节学习目标：
${objectivesText}

项目总体学习目标：
${project.learningObjectives?.map((o, i) => `${i + 1}. ${o}`).join('\n') || '无'}

请基于以上学习目标进行启发式教学引导，帮助学生达成这些目标。`;

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

      const finalChapters = updatedProject.chapters.map(c => {
        if (c.id !== chapterId) return c;
        
        if (subChapterId) {
          return {
            ...c,
            subChapters: c.subChapters?.map(s =>
              s.id === subChapterId
                ? { ...s, messages: [...s.messages, assistantMessage] }
                : s
            ),
          };
        } else {
          return { ...c, messages: [...c.messages, assistantMessage] };
        }
      });

      const finalProject = { ...updatedProject, chapters: finalChapters };
      setProject(finalProject);
      saveProject(finalProject);
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

      const errorChapters = updatedProject.chapters.map(c => {
        if (c.id !== chapterId) return c;
        
        if (subChapterId) {
          return {
            ...c,
            subChapters: c.subChapters?.map(s =>
              s.id === subChapterId
                ? { ...s, messages: [...s.messages, errorAssistantMessage] }
                : s
            ),
          };
        } else {
          return { ...c, messages: [...c.messages, errorAssistantMessage] };
        }
      });

      const errorProject = { ...updatedProject, chapters: errorChapters };
      setProject(errorProject);
      saveProject(errorProject);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const updatedChapters = project.chapters.map(c => {
      if (c.id !== chapterId) return c;
      
      if (subChapterId) {
        return {
          ...c,
          subChapters: c.subChapters?.map(s =>
            s.id === subChapterId ? { ...s, messages: [] } : s
          ),
        };
      } else {
        return { ...c, messages: [] };
      }
    });
    
    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    saveProject(updatedProject);
    toast({
      title: "对话已重置",
      description: "你可以重新开始学习",
    });
  };

  const handleComplete = () => {
    let earnedRewards: { dimension: string; points: number }[] = [];

    const updatedChapters = project.chapters.map(c => {
      if (c.id !== chapterId) return c;
      
      if (subChapterId) {
        const updatedSubChapters = c.subChapters?.map(s => {
          if (s.id === subChapterId) {
            // Collect skill rewards
            if (s.skillRewards && s.skillRewards.length > 0) {
              earnedRewards = s.skillRewards;
            }
            return { ...s, completed: true };
          }
          return s;
        });
        
        // Check if all subChapters are completed
        const allSubCompleted = updatedSubChapters?.every(s => s.completed) ?? true;
        
        return { 
          ...c, 
          subChapters: updatedSubChapters,
          completed: allSubCompleted,
        };
      } else {
        return { ...c, completed: true };
      }
    });

    const updatedProject = { ...project, chapters: updatedChapters };
    setProject(updatedProject);
    saveProject(updatedProject);

    // Update skill dimensions if there are rewards
    if (earnedRewards.length > 0) {
      const profile = getUserProfile();
      earnedRewards.forEach(reward => {
        const dimension = profile.dimensions.find(d => d.name === reward.dimension);
        if (dimension) {
          dimension.score = Math.min(dimension.score + reward.points, dimension.maxScore);
        } else {
          profile.dimensions.push({
            name: reward.dimension,
            score: reward.points,
            maxScore: 100,
          });
        }
      });
      profile.completedChapters += 1;
      saveUserProfile(profile);

      const rewardText = earnedRewards.map(r => `${r.dimension} +${r.points}`).join(', ');
      toast({
        title: "学习完成！获得能力积分",
        description: rewardText,
      });
    } else {
      toast({
        title: subChapterId ? "子章节完成！" : "章节完成！",
        description: "继续保持，你正在取得进步！",
      });
    }

    navigate(`/projects/${projectId}`);
  };

  const title = subChapter ? subChapter.title : chapter.title;
  const subtitle = subChapter ? `${project.title} · ${chapter.title}` : project.title;
  const objectives = currentTarget?.objectives || [];

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
                {title}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block line-clamp-1">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleResetChat}>
              <RotateCcw className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">重置</span>
            </Button>
            <Button size="sm" onClick={handleComplete}>
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">完成学习</span>
            </Button>
          </div>
        </div>

        {/* Learning Objectives Panel */}
        {objectives.length > 0 && (
          <div className="border-b border-border bg-muted/30">
            <button
              onClick={() => setShowObjectives(!showObjectives)}
              className="w-full px-4 py-2 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">学习目标</span>
              </div>
              {showObjectives ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showObjectives && (
              <div className="px-4 pb-3">
                <ul className="space-y-1">
                  {objectives.map((objective, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
                {/* Show skill rewards if available */}
                {subChapter?.skillRewards && subChapter.skillRewards.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Award className="w-3 h-3 text-primary" />
                      <span>完成奖励：</span>
                      {subChapter.skillRewards.map((r, i) => (
                        <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {r.dimension} +{r.points}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* API Warning */}
        {!settings && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              请先在 <Link to="/settings" className="underline">设置页面</Link> 配置 LLM API
            </span>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="输入你的问题或想法..."
          />
        </div>
      </div>
    </AppLayout>
  );
}