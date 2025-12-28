import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getProject,
  saveProject,
  generateId,
  ChatMessage,
  getLLMSettings,
  getUserProfile,
  saveUserProfile,
  SubChapter,
} from "@/lib/storage";
import {
  ArrowLeft,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Target,
  ChevronDown,
  ChevronRight,
  Award,
  FileText,
  Save,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const SOCRATIC_PROMPT = `# Role
你是一位以“认知成长”为核心的苏格拉底式导师。你的目标不是为了让学生感到舒服，而是为了让学生通过深度的思考、试错和纠正，真正掌握知识并构建严密的逻辑体系。你坚持“严慈相济”：对学生的努力保持鼓励（慈），对学生的逻辑漏洞和知识错误保持零容忍（严）。

# Core Philosophy
1.  **思维优于答案**：答案只是副产品，推导过程才是核心，帮助其形成正确的逻辑和思维方式才是学生的终身目的。
2.  **必要的认知冲突**：当学生处于舒适区或持有错误观念时，你需要制造认知冲突，迫使他们重新审视自己的假设。
3.  **最近发展区 (ZPD)**：你的引导难度应略高于学生当前水平，让他们“跳一跳才够得着”。

# Operational Guidelines

## 1. 启动阶段 (Goal Setting)
* 开场时，不直接讲课。先询问或协助学生明确本节课具体的“学习目标”（Learning Objective）。
* 确认目标后，评估学生的基础认知，再决定从哪里开始引导。

## 2. 引导原则 (Guiding Protocol)
* **禁止直接教学**：严禁直接给出定义、答案或长篇大论的解释（除非学生已经尝试了多次且完全卡住）。
* **少即是多**：每次回复通常只包含 1-2 个核心问题或反直觉的场景假设。
* **追问到底**：当学生回答正确时，不要急着通过。追问：“你是怎么得出这个结论的？”或“如果条件X变了，这个结论还成立吗？”以验证是否真正理解，而非死记硬背。

## 3. 错误处理与反馈 (Error Handling & Feedback) - **CRITICAL**
* **直面错误**：如果学生出现知识性错误，不要模糊处理。明确指出：“这里的数据/事实是不准确的，请核实X。”
* **逻辑纠偏**：如果学生出现思维性错误（如因果倒置、循环论证），必须严厉（但非人身攻击）地指出逻辑断裂点，指出其错误的思维方式，说明如何采取正确的思维方式，帮助其形成正确的逻辑和思维。
    * *Bad:* “这个思路有点意思，但有没有可能……”
    * *Good:* “你的推导存在逻辑漏洞。你预设了A是B的原因，但没有证据支持这一点。请重新思考这两者的关系。”
* **拒绝伪勤奋**：如果学生试图用模糊的废话糊弄，或者依赖猜测，请立刻叫停，要求其展示具体的思考步骤。

## 4. 辅助手段 (Scaffolding)
* **类比降维**：当概念过于抽象时，使用生活中的类比（但要提醒类比的局限性）。
* **反例验证**：提供一个反例，打破学生的错误归纳。

## 5. 阶段总结 (Checkpoint)
* 在完成一个小的知识点闭环后，要求学生用自己的话总结。如果总结不到位，打回重写，直到达标为止。

# Tone & Style
* **专业、客观、坚定**。
* 不使用过度讨好的语气词（如“亲爱的”、“没关系哦”）。
* 像一位严格的体育教练：在动作变形时立即纠正，在动作标准时给予肯定。

# Initialization
请以简短的问候开始，并询问用户今天想探索什么主题或达成什么学习目标。`;

export default function Learning() {
  const { projectId, chapterId, subChapterId } = useParams<{
    projectId: string;
    chapterId: string;
    subChapterId?: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(() => getProject(projectId!));
  const [isLoading, setIsLoading] = useState(false);
  const [showObjectives, setShowObjectives] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const chapter = project?.chapters.find((c) => c.id === chapterId);
  const subChapter = subChapterId ? chapter?.subChapters?.find((s) => s.id === subChapterId) : null;
  const settings = getLLMSettings();

  // Determine current learning target (subChapter if specified, otherwise chapter)
  const currentTarget = subChapter || chapter;
  const messages = subChapter ? subChapter.messages : chapter?.messages || [];

  // Load notes when component mounts or subChapter changes
  useEffect(() => {
    if (subChapter) {
      setNotes(subChapter.notes || "");
    }
  }, [subChapterId, subChapter?.notes]);

  // Auto-save notes with debounce
  const saveNotes = useCallback(
    (notesContent: string) => {
      if (!project || !chapterId || !subChapterId) return;

      const updatedChapters = project.chapters.map((c) => {
        if (c.id !== chapterId) return c;
        return {
          ...c,
          subChapters: c.subChapters?.map((s) => (s.id === subChapterId ? { ...s, notes: notesContent } : s)),
        };
      });

      const updatedProject = { ...project, chapters: updatedChapters };
      setProject(updatedProject);
      saveProject(updatedProject);
    },
    [project, chapterId, subChapterId],
  );

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    saveNotes(notes);
    setTimeout(() => {
      setIsSavingNotes(false);
      toast({
        title: "笔记已保存",
        description: "你的学习笔记已自动保存",
      });
    }, 300);
  };

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
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    // Update project with user message
    const updatedChapters = project.chapters.map((c) => {
      if (c.id !== chapterId) return c;

      if (subChapterId) {
        return {
          ...c,
          subChapters: c.subChapters?.map((s) =>
            s.id === subChapterId ? { ...s, messages: [...s.messages, userMessage] } : s,
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
        throw new Error("请先在设置页面配置 LLM API");
      }

      // Build messages for LLM
      const currentMessages = subChapterId
        ? updatedChapters.find((c) => c.id === chapterId)?.subChapters?.find((s) => s.id === subChapterId)?.messages
        : updatedChapters.find((c) => c.id === chapterId)?.messages;

      const historyMessages =
        currentMessages?.map((m) => ({
          role: m.role,
          content: m.content,
        })) || [];

      // Build objectives context
      const targetObjectives = currentTarget?.objectives || [];
      const objectivesText = targetObjectives.length
        ? targetObjectives.map((o, i) => `${i + 1}. ${o}`).join("\n")
        : "无具体目标";

      const systemPrompt = `${SOCRATIC_PROMPT}

当前学习内容：
- 项目：${project.title}
- 章节：${chapter.title}
${subChapter ? `- 子章节：${subChapter.title}` : ""}
- 描述：${currentTarget?.description || ""}

本节学习目标：
${objectivesText}

项目总体学习目标：
${project.learningObjectives?.map((o, i) => `${i + 1}. ${o}`).join("\n") || "无"}

请基于以上学习目标进行启发式教学引导，帮助学生达成这些目标。`;

      const { data, error } = await supabase.functions.invoke("chat", {
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

      const assistantContent = data.choices?.[0]?.message?.content || "抱歉，我暂时无法回应。请稍后再试。";

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      const finalChapters = updatedProject.chapters.map((c) => {
        if (c.id !== chapterId) return c;

        if (subChapterId) {
          return {
            ...c,
            subChapters: c.subChapters?.map((s) =>
              s.id === subChapterId ? { ...s, messages: [...s.messages, assistantMessage] } : s,
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
      const errorMessage = err instanceof Error ? err.message : "请求失败";
      toast({
        title: "AI 回复失败",
        description: errorMessage,
        variant: "destructive",
      });

      // Add error message as assistant response
      const errorAssistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `抱歉，发生了错误：${errorMessage}`,
        timestamp: new Date().toISOString(),
      };

      const errorChapters = updatedProject.chapters.map((c) => {
        if (c.id !== chapterId) return c;

        if (subChapterId) {
          return {
            ...c,
            subChapters: c.subChapters?.map((s) =>
              s.id === subChapterId ? { ...s, messages: [...s.messages, errorAssistantMessage] } : s,
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
    const updatedChapters = project.chapters.map((c) => {
      if (c.id !== chapterId) return c;

      if (subChapterId) {
        return {
          ...c,
          subChapters: c.subChapters?.map((s) => (s.id === subChapterId ? { ...s, messages: [] } : s)),
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
    // Save notes before completing
    if (subChapterId && notes) {
      saveNotes(notes);
    }

    let earnedRewards: { dimension: string; points: number }[] = [];

    const updatedChapters = project.chapters.map((c) => {
      if (c.id !== chapterId) return c;

      if (subChapterId) {
        const updatedSubChapters = c.subChapters?.map((s) => {
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
        const allSubCompleted = updatedSubChapters?.every((s) => s.completed) ?? true;

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
      earnedRewards.forEach((reward) => {
        const dimension = profile.dimensions.find((d) => d.name === reward.dimension);
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

      const rewardText = earnedRewards.map((r) => `${r.dimension} +${r.points}`).join(", ");
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
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">{title}</h1>
              <p className="text-xs text-muted-foreground hidden md:block line-clamp-1">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {subChapterId && (
              <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)} className="hidden md:flex">
                {showNotes ? <PanelRightClose className="w-4 h-4 mr-1" /> : <PanelRightOpen className="w-4 h-4 mr-1" />}
                <span className="hidden lg:inline">笔记</span>
              </Button>
            )}
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
              请先在{" "}
              <Link to="/settings" className="underline">
                设置页面
              </Link>{" "}
              配置 LLM API
            </span>
          </div>
        )}

        {/* Main Content Area - Chat + Notes */}
        <div className="flex-1 overflow-hidden flex">
          {/* Chat Interface */}
          <div
            className={cn(
              "flex-1 overflow-hidden transition-all duration-300",
              showNotes && subChapterId ? "md:w-[60%]" : "w-full",
            )}
          >
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="输入你的问题或想法..."
            />
          </div>

          {/* Notes Panel - Only show for subChapter learning */}
          {subChapterId && showNotes && (
            <div className="hidden md:flex w-[40%] border-l border-border flex-col bg-card">
              {/* Notes Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-sm">学习笔记</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSavingNotes ? "保存中..." : "保存"}
                </Button>
              </div>

              {/* Notes Content */}
              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="在这里记录你的学习笔记...

• 记录关键概念和定义
• 写下你的疑问和思考
• 总结学到的要点
• 记录与其他知识的联系"
                  className="flex-1 resize-none bg-background text-foreground placeholder:text-muted-foreground min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  提示：笔记会在完成学习时自动保存，也可点击保存按钮手动保存
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Notes Toggle */}
        {subChapterId && (
          <div className="md:hidden border-t border-border">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">学习笔记</span>
              </div>
              {showNotes ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showNotes && (
              <div className="p-4 border-t border-border">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="在这里记录你的学习笔记..."
                  className="resize-none bg-background text-foreground placeholder:text-muted-foreground min-h-[120px]"
                />
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                    <Save className="w-4 h-4 mr-1" />
                    {isSavingNotes ? "保存中..." : "保存笔记"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
