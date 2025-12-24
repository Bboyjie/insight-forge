import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CreateProjectForm, ProjectFormData } from '@/components/projects/CreateProjectForm';
import { Button } from '@/components/ui/button';
import { saveProject, generateId, StudyProject, Chapter, getLLMSettings } from '@/lib/storage';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const PLANNER_PROMPT = `你是一个专业的课程设计师和学习规划专家。

请根据用户提供的信息，生成一个结构化的学习大纲。

要求：
1. 大纲应该包含 5-8 个章节
2. 每个章节都有明确的标题和学习目标描述
3. 章节安排应该由浅入深，循序渐进
4. 考虑用户的当前水平和可用时间

请以 JSON 格式返回，格式如下：
{
  "chapters": [
    {
      "title": "第1章：章节标题",
      "description": "本章节的学习目标和主要内容描述"
    }
  ]
}

只返回 JSON，不要有其他内容。`;

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const settings = getLLMSettings();

  const generateChaptersWithAI = async (data: ProjectFormData): Promise<Chapter[]> => {
    if (!settings?.baseUrl || !settings?.apiKey || !settings?.modelName) {
      throw new Error('请先配置 LLM API');
    }

    const levelNames = ['零基础', '入门', '进阶', '专家'];
    const userPrompt = `请为以下学习主题生成学习大纲：

主题：${data.topic}
学习目的：${data.goal}
当前水平：${levelNames[data.level - 1]}
每日学习时间：${data.timePerDay} 分钟
学习周期：${data.durationDays} 天`;

    const { data: response, error } = await supabase.functions.invoke('chat', {
      body: {
        messages: [{ role: 'user', content: userPrompt }],
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
        systemPrompt: PLANNER_PROMPT,
        stream: false,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (response.error) {
      throw new Error(response.error);
    }

    const content = response.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析 AI 返回的内容');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
        throw new Error('AI 返回格式错误');
      }

      return parsed.chapters.map((ch: { title: string; description: string }, i: number) => ({
        id: generateId(),
        title: ch.title || `第${i + 1}章`,
        description: ch.description || '',
        completed: false,
        messages: [],
      }));
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('无法解析学习大纲，请重试');
    }
  };

  const generateMockChapters = (topic: string): Chapter[] => {
    const baseChapters = [
      { title: '概述与入门', description: `了解${topic}的基本概念和历史背景` },
      { title: '核心概念', description: `深入理解${topic}的核心理论和原则` },
      { title: '实践应用', description: `将${topic}的知识应用到实际场景` },
      { title: '进阶探索', description: `探索${topic}的高级主题和前沿发展` },
      { title: '总结与反思', description: `回顾学习成果，巩固知识体系` },
    ];

    return baseChapters.map((ch, i) => ({
      id: generateId(),
      title: `第${i + 1}章：${ch.title}`,
      description: ch.description,
      completed: false,
      messages: [],
    }));
  };

  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);

    try {
      let chapters: Chapter[];

      // Try to generate with AI, fallback to mock if not configured
      if (settings?.baseUrl && settings?.apiKey && settings?.modelName) {
        try {
          chapters = await generateChaptersWithAI(data);
          toast({
            title: "AI 已生成学习大纲",
            description: `共 ${chapters.length} 个章节`,
          });
        } catch (aiError) {
          console.error('AI generation failed:', aiError);
          toast({
            title: "AI 生成失败，使用默认模板",
            description: aiError instanceof Error ? aiError.message : '请检查 API 配置',
            variant: "destructive",
          });
          chapters = generateMockChapters(data.topic);
        }
      } else {
        chapters = generateMockChapters(data.topic);
      }

      const project: StudyProject = {
        id: generateId(),
        title: data.topic.length > 20 ? data.topic.substring(0, 20) + '...' : data.topic,
        topic: data.topic,
        goal: data.goal,
        level: data.level,
        timePerDay: data.timePerDay,
        durationDays: data.durationDays,
        chapters,
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      saveProject(project);

      toast({
        title: "学习计划已创建",
        description: `共 ${project.chapters.length} 个章节，开始你的学习之旅吧！`,
      });

      navigate(`/projects/${project.id}`);
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "请检查网络连接后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">新建学习项目</h1>
          <p className="text-muted-foreground mt-2">
            填写以下信息，AI 将为你生成个性化的学习大纲
          </p>
        </div>

        {!settings && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">未配置 AI 接口</p>
              <p className="text-sm text-muted-foreground mt-1">
                请先在 <Link to="/settings" className="underline text-primary">设置页面</Link> 配置你的 LLM API 接口，否则将使用默认模板
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border p-6 md:p-8">
          <CreateProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
}
