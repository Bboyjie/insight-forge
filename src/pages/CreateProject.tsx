import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CreateProjectForm, ProjectFormData } from '@/components/projects/CreateProjectForm';
import { Button } from '@/components/ui/button';
import { saveProject, generateId, StudyProject, Chapter, getLLMSettings } from '@/lib/storage';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const settings = getLLMSettings();

  const generateMockChapters = (topic: string): Chapter[] => {
    // Mock chapters for demo - in production this would come from LLM
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

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const project: StudyProject = {
        id: generateId(),
        title: data.topic.length > 20 ? data.topic.substring(0, 20) + '...' : data.topic,
        topic: data.topic,
        goal: data.goal,
        level: data.level,
        timePerDay: data.timePerDay,
        durationDays: data.durationDays,
        chapters: generateMockChapters(data.topic),
        createdAt: new Date().toISOString(),
        progress: 0,
      };

      saveProject(project);

      toast({
        title: "学习计划已生成",
        description: `共 ${project.chapters.length} 个章节，开始你的学习之旅吧！`,
      });

      navigate(`/projects/${project.id}`);
    } catch (error) {
      toast({
        title: "生成失败",
        description: "请检查网络连接或API设置后重试",
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
                请先在 <Link to="/settings" className="underline text-primary">设置页面</Link> 配置你的 LLM API 接口
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
