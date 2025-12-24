import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { getProjects } from '@/lib/storage';
import { Plus, BookOpen } from 'lucide-react';

export default function Projects() {
  const projects = getProjects();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">学习项目</h1>
            <p className="text-muted-foreground mt-1">管理你的学习计划</p>
          </div>
          <Link to="/projects/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新建项目
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-card border border-border p-12 text-center">
            <div className="w-16 h-16 bg-primary/10 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">还没有学习项目</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              创建一个学习项目，AI 将根据你的目标和基础，生成个性化的学习大纲
            </p>
            <Link to="/projects/new">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                创建第一个项目
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
