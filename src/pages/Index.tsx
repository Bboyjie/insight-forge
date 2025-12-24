import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { getUserProfile, getProjects, getJournals } from '@/lib/storage';
import { BookOpen, Clock, CheckCircle, PenLine, Plus, ArrowRight, Sparkles } from 'lucide-react';

export default function Index() {
  const profile = getUserProfile();
  const projects = getProjects().slice(0, 3);
  const journals = getJournals().slice(0, 3);
  const completedChapters = projects.reduce(
    (acc, p) => acc + p.chapters.filter(c => c.completed).length, 
    0
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">个人成长与学习辅助</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            欢迎回来
          </h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-xl">
            通过启发式对话学习，量化你的多维成长
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatsCard
            title="学习项目"
            value={projects.length}
            icon={<BookOpen className="w-5 h-5 text-primary" />}
          />
          <StatsCard
            title="完成章节"
            value={completedChapters}
            icon={<CheckCircle className="w-5 h-5 text-primary" />}
          />
          <StatsCard
            title="学习时间"
            value={`${Math.floor(profile.totalLearningMinutes / 60)}h`}
            subtitle={`${profile.totalLearningMinutes % 60}分钟`}
            icon={<Clock className="w-5 h-5 text-primary" />}
          />
          <StatsCard
            title="日记条目"
            value={journals.length}
            icon={<PenLine className="w-5 h-5 text-primary" />}
          />
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Skill Radar */}
          <section className="bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">能力雷达</h2>
            </div>
            <SkillRadarChart dimensions={profile.dimensions} />
          </section>

          {/* Recent Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">学习项目</h2>
              <Link to="/projects">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {projects.length === 0 ? (
              <div className="bg-card border border-border p-8 text-center">
                <div className="w-12 h-12 bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">开始你的学习之旅</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  创建第一个学习项目，开启启发式学习体验
                </p>
                <Link to="/projects/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    新建项目
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quick Actions */}
        <section className="mt-12 grid md:grid-cols-2 gap-4">
          <Link to="/projects/new" className="block">
            <div className="bg-primary text-primary-foreground p-6 hover:opacity-90 transition-opacity">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">新建学习项目</h3>
                  <p className="text-sm opacity-80 mt-1">AI 为你定制专属学习路径</p>
                </div>
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </Link>
          <Link to="/journal/new" className="block">
            <div className="bg-secondary text-secondary-foreground p-6 hover:opacity-90 transition-opacity">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">写日记</h3>
                  <p className="text-sm opacity-80 mt-1">记录思考，与 AI 对话成长</p>
                </div>
                <PenLine className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
