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
1. 大纲应该包含 4-6 个主要章节
2. 每个章节都有明确的标题、描述和 2-3 个具体的学习目标
3. 每个章节可以包含 2-4 个子章节，子章节也需要有自己的学习目标
4. 生成整个学习项目的总体学习目标（3-5个）
5. 章节安排应该由浅入深，循序渐进
6. 学习目标应该是具体的、可衡量的
7. 考虑用户的当前水平和可用时间

请以 JSON 格式返回，格式如下：
{
  "learningObjectives": [
    "总体学习目标1：...",
    "总体学习目标2：..."
  ],
  "chapters": [
    {
      "title": "第1章：章节标题",
      "description": "本章节的主要内容描述",
      "objectives": [
        "掌握...",
        "理解..."
      ],
      "subChapters": [
        {
          "title": "1.1 子章节标题",
          "description": "子章节内容描述",
          "objectives": ["学会..."]
        }
      ]
    }
  ]
}

只返回 JSON，不要有其他内容。`;

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const settings = getLLMSettings();

  const generateChaptersWithAI = async (data: ProjectFormData): Promise<{ chapters: Chapter[], learningObjectives: string[] }> => {
    if (!settings?.baseUrl || !settings?.apiKey || !settings?.modelName) {
      throw new Error('请先配置 LLM API');
    }

    const levelNames = ['零基础', '入门', '进阶', '专家'];
    const userPrompt = `请为以下学习主题生成学习大纲：

主题：${data.topic}
学习目的：${data.goal}
当前水平：${levelNames[data.level]}
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

      const chapters = parsed.chapters.map((ch: any, i: number) => ({
        id: generateId(),
        title: ch.title || `第${i + 1}章`,
        description: ch.description || '',
        objectives: ch.objectives || [],
        subChapters: ch.subChapters?.map((sub: any) => ({
          id: generateId(),
          title: sub.title || '',
          description: sub.description || '',
          objectives: sub.objectives || [],
          completed: false,
        })) || [],
        completed: false,
        messages: [],
      }));

      return {
        chapters,
        learningObjectives: parsed.learningObjectives || [],
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('无法解析学习大纲，请重试');
    }
  };

  const generateMockChapters = (topic: string): { chapters: Chapter[], learningObjectives: string[] } => {
    const learningObjectives = [
      `理解${topic}的核心概念和基本原理`,
      `掌握${topic}的关键技能和方法`,
      `能够将${topic}知识应用到实际场景中`,
    ];

    const baseChapters = [
      { 
        title: '概述与入门', 
        description: `了解${topic}的基本概念和历史背景`,
        objectives: [`了解${topic}的定义和范围`, `理解${topic}的历史发展`],
        subChapters: [
          { title: '基本概念', description: '核心术语和定义', objectives: ['掌握基本术语'] },
          { title: '发展历史', description: '历史演变过程', objectives: ['了解发展脉络'] },
        ],
      },
      { 
        title: '核心概念', 
        description: `深入理解${topic}的核心理论和原则`,
        objectives: [`掌握${topic}的核心理论`, `理解关键原则`],
        subChapters: [
          { title: '理论框架', description: '主要理论体系', objectives: ['理解理论框架'] },
          { title: '关键原则', description: '核心原则详解', objectives: ['掌握关键原则'] },
        ],
      },
      { 
        title: '实践应用', 
        description: `将${topic}的知识应用到实际场景`,
        objectives: [`能够应用所学知识`, `解决实际问题`],
        subChapters: [
          { title: '案例分析', description: '典型案例研究', objectives: ['分析典型案例'] },
          { title: '实践练习', description: '动手实践', objectives: ['完成实践项目'] },
        ],
      },
      { 
        title: '进阶探索', 
        description: `探索${topic}的高级主题和前沿发展`,
        objectives: [`了解前沿发展`, `深入研究高级主题`],
        subChapters: [
          { title: '高级主题', description: '深入探讨', objectives: ['掌握高级概念'] },
          { title: '前沿发展', description: '最新进展', objectives: ['了解发展趋势'] },
        ],
      },
      { 
        title: '总结与反思', 
        description: `回顾学习成果，巩固知识体系`,
        objectives: [`总结所学内容`, `建立知识体系`],
        subChapters: [
          { title: '知识回顾', description: '系统复习', objectives: ['巩固知识点'] },
          { title: '自我评估', description: '学习效果评估', objectives: ['评估学习成果'] },
        ],
      },
    ];

    const chapters = baseChapters.map((ch, i) => ({
      id: generateId(),
      title: `第${i + 1}章：${ch.title}`,
      description: ch.description,
      objectives: ch.objectives,
      subChapters: ch.subChapters.map((sub) => ({
        id: generateId(),
        title: sub.title,
        description: sub.description,
        objectives: sub.objectives,
        completed: false,
      })),
      completed: false,
      messages: [],
    }));

    return { chapters, learningObjectives };
  };

  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);

    try {
      let result: { chapters: Chapter[], learningObjectives: string[] };

      // Try to generate with AI, fallback to mock if not configured
      if (settings?.baseUrl && settings?.apiKey && settings?.modelName) {
        try {
          result = await generateChaptersWithAI(data);
          toast({
            title: "AI 已生成学习大纲",
            description: `共 ${result.chapters.length} 个章节`,
          });
        } catch (aiError) {
          console.error('AI generation failed:', aiError);
          toast({
            title: "AI 生成失败，使用默认模板",
            description: aiError instanceof Error ? aiError.message : '请检查 API 配置',
            variant: "destructive",
          });
          result = generateMockChapters(data.topic);
        }
      } else {
        result = generateMockChapters(data.topic);
      }

      const project: StudyProject = {
        id: generateId(),
        title: data.topic.length > 20 ? data.topic.substring(0, 20) + '...' : data.topic,
        topic: data.topic,
        goal: data.goal,
        level: data.level,
        timePerDay: data.timePerDay,
        durationDays: data.durationDays,
        chapters: result.chapters,
        learningObjectives: result.learningObjectives,
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
