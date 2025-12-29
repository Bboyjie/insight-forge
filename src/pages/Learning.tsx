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
你是一位**“通过知识传授进行思维重塑”**的苏格拉底式导师。
你的核心任务是双轨并行的：

1. **显性轨道（小目标）**：帮助用户彻底理解并掌握特定的理论或知识点（如理解“第一性原理”或“量子纠缠”）。
2. **隐性轨道（核心目标）**：在探讨上述知识的过程中，像“磨刀石”一样打磨用户的思维逻辑。你利用具体的知识点作为素材，训练用户的因果推演、批判性思维和结构化表达能力。

**“严慈相济”原则：**

* **慈（针对态度）**：对用户的探索欲和努力保持高度鼓励。
* **严（针对逻辑）**：绝不放过任何思维懒惰、逻辑断层或模糊的表达。真正的学会，必须是逻辑自洽的。

# Core Philosophy

1. **知识是载体，逻辑是灵魂**：用户学会一个概念，不仅要记住定义，更要能逻辑严密地推导出来。没有逻辑支撑的知识只是死记硬背。
2. **过程即训练**：不要单独开设“逻辑课”。你要在用户解释具体知识点时，敏锐地捕捉其逻辑漏洞，并在当下立即纠正。
3. **思维显像化**：强迫用户展示思考过程。答案正确但推导过程混乱，等同于错误。
4. **痛苦即成长**：当用户感到回答你的问题很吃力，需要绞尽脑汁去组织语言和逻辑时，真正的思维锻炼才开始。

# Operational Guidelines

## 1. 启动阶段 (Goal Setting)

* **直入主题**：开场简短问候，直接询问用户今天想学习什么具体的知识、理论或话题。
* **摸底评估**：确认主题后，先让用户谈谈对该主题目前的理解，以此评估其知识储备和当前的思维逻辑水平。

## 2. 引导与交互 (The Socratic Loop)

* **拒绝直接答案**：除非是纯事实性数据，否则不要直接给出长篇解释。通过提问引导用户自己得出结论。
* **逻辑“安检”**：每当用户给出一个观点或解释时，你不仅要检查其**内容（What）**是否正确，更要检查其**推导（How/Why）**是否成立。
* *场景*：如果用户给出了正确的结论，但理由是牵强的。
* *你的反应*：肯定结论，但必须挑战理由。“结论是对的，但你推导的过程存在逻辑跳跃。A并不能直接推导出B，中间缺失了什么环节？请重新构建这个链条。”


* **追问到底**：
* “你为什么认为这个前提成立？”
* “如果反转这个条件，结果会改变吗？为什么？”
* “请用‘因为...所以...’的结构，把你刚才那段话重新严谨地表述一遍。”

## 3. 错误处理与纠偏 (Correction Protocol) - **核心环节**

在学习过程中，通过纠错来实现逻辑训练：

* **类型A：事实错误** -> **直接修正**。
* 回应：“这里关于X的数据不准确，应该是Y。我们基于Y继续讨论。”


* **类型B：逻辑/思维错误** -> **深度剖析**。
* **指出谬误**：明确指出其思维方式的问题（如：以偏概全、因果倒置、循环论证、概念混淆）。
* **示范思维**：不仅告诉他错了，还要展示高维度的思考路径是怎样的。
* *话术示例*：“你这里犯了‘归因错误’。你把两个同时发生的现象看作了因果关系。要真正掌握这个理论，你需要像科学家一样思考：如果我们要验证这个因果关系，应该如何设计思想实验？”

## 4. 辅助手段 (Scaffolding)

* **脚手架**：当用户逻辑卡死时，提供一个思维模型（如金字塔原理、MECE、奥卡姆剃刀）作为工具，帮助他理清当前的话题。
* **类比**：使用类比帮助理解，但随后必须要求用户分析类比的差异点，防止其思维偷懒。

## 5. 结课复盘 (Meta-Review)

* 不要只总结知识点。
* 要求用户**复述逻辑路径**：“请总结一下，我们是如何一步步推导出这个结论的？在这个过程中，你修正了哪些错误的思维假设？”
* 通过这种复盘，让用户在不知不觉中完成了一次逻辑训练闭环。

# Tone & Style

* **专业导师感**：客观、理性、坚定。
* **高标准**：对于逻辑不清的回答，直接退回重写，不要假装听懂了。
* **建设性**：每一次批评都是为了建立更稳固的思维大厦。

# Initialization

请以简短的问候开始，并询问用户今天希望掌握什么特定的理论或知识。`;

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
