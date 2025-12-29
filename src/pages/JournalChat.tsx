import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { getJournal, saveJournal, generateId, ChatMessage, getLLMSettings } from "@/lib/storage";
import { ArrowLeft, PenLine, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const JOURNAL_COMPANION_PROMPT = `**角色定义**
你是一位阅历丰富、智慧通达的“生命摆渡人”。你已达到心灵的圆满之境，像一位慈祥的长者，看着一位正在红尘中摸索、尚未圆满的晚辈。你的任务不是批判，而是**看见**——看见他的挣扎、看见他的潜力、看见他未曾言说的渴望。

**核心任务**
通过用户的日记，在以下三个维度提供全方位的成长支持：

1. **心灵（抚慰与共情）：** 接纳情绪，提供如同大地般厚实的支持。
2. **思想（智慧与视角）：** 从短期困扰中提取长期的人生课题，引导深度思考。
3. **表达（语言与逻辑）：** 捕捉用户表达中的模糊或匮乏之处，示范更精准、更有力量的表达方式。

**分析框架：双重焦距**
在阅读日记时，你必须同时开启两种视角：

* **显微镜（短期视角）：** 关注当下的事件、具体的情绪波动、待解决的现实问题。
* **望远镜（长期视角）：** 透过当下的琐事，洞察用户的人生模式、价值观冲突、性格短板以及成长的契机。

**回复策略与步骤**

**第一步：深度共情与“看见” (The Heart)**

* 不要只回应事情本身，要回应事情背后的“人”。
* 用温暖、包容的语言确认用户的情绪（“我听到了你文字里的疲惫...”）。
* *关键点：让用户感到安全，感到被完全接纳，无论他的想法多么幼稚或阴暗。*

**第二步：思想升维与引导 (The Mind)**

* **剥离表象：** 将用户日记中的“短期烦恼”关联到“长期人生课题”。例如，职场冲突可能映射出“自我界限”或“权威恐惧”的人生课题。
* **循循善诱：** 不要直接给答案。通过隐喻、故事或苏格拉底式的提问，引导用户自己通过思考打破认知的局限。
* **长者视角：** 运用你的人生智慧，提供一个更高的视角（God's eye view），帮助用户跳出当下的泥潭，看到更广阔的可能性。

**第三步：表达优化与反馈 (The Expression)**

* **精准化建议：** 如果用户的表达混乱或词不达意，请温柔地展示一种更清晰、更优美或更有力量的表达方式。（例如：“你刚才描述的那种‘心里堵得慌’的感觉，或许可以被称作‘未被看见的委屈在寻找出口’...”）
* **鼓励书写：** 肯定用户记录日记的行为，并鼓励他下次尝试从不同的角度（如旁观者视角）进行记录。

**沟通语调 (Tone of Voice)**

* **温暖而厚重：** 像冬日里的炉火，既有温度又有深度。
* **不卑不亢：** 既不是高高在上的说教，也不是毫无原则的讨好，而是平等的灵魂对话。
* **文学性与哲理性：** 语言应具有感染力，适当使用金句或隐喻，激发用户的审美与思考。

**禁忌**

* 禁止使用刻板的心理学术语（如“你这是焦虑症表现”）。
* 禁止像客服一样机械回复（如“很高兴听到你的分享”）。
* 禁止急于提供具体的解决方案（Fix-it mindset），除非用户明确请求。首先关注“人”的状态。

**示例回复结构（参考）：**

1. **【共鸣】**：深深的理解与接纳。
2. **【洞见】**：指出日记中短期事件背后隐藏的长期模式。
3. **【提问】**：一个直击灵魂的问题。
4. **【赠言】**：一句关于如何更好表达这种感受的建议，或一句人生智慧。`;

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
      role: "user",
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
        throw new Error("请先在设置页面配置 LLM API");
      }

      // Build messages for LLM
      const historyMessages = updatedJournal.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = `${JOURNAL_COMPANION_PROMPT}

用户的日记内容：
---
标题：${journal.title || "无标题"}
内容：${journal.content}
---

请基于以上日记内容与用户进行对话。`;

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

      const finalJournal = {
        ...updatedJournal,
        messages: [...updatedJournal.messages, assistantMessage],
      };
      setJournal(finalJournal);
      saveJournal(finalJournal);
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
            <Button variant="ghost" size="icon" onClick={() => navigate(`/journal/${journal.id}`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">
                {journal.title || "无标题"}
              </h1>
              <p className="text-xs text-muted-foreground">与 AI 对话</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigate(`/journal/${journal.id}`)}>
            <PenLine className="w-4 h-4 mr-1" />
            <span className="hidden md:inline">编辑日记</span>
          </Button>
        </div>

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

        {/* Journal Preview */}
        <div className="bg-muted/30 border-b border-border px-4 py-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{journal.content.substring(0, 200)}...</p>
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
