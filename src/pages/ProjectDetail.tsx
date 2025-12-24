import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getProject, saveProject, deleteProject } from '@/lib/storage';
import { ArrowLeft, Play, CheckCircle, Circle, Trash2, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(() => getProject(id!));

  if (!project) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">项目不存在</h1>
          <Link to="/projects">
            <Button>返回项目列表</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const completedChapters = project.chapters.filter(c => c.completed).length;
  const progressPercent = project.chapters.length > 0 
    ? (completedChapters / project.chapters.length) * 100 
    : 0;

  const handleDelete = () => {
    deleteProject(project.id);
    toast({
      title: "项目已删除",
      description: `"${project.title}" 已被删除`,
    });
    navigate('/projects');
  };

  const toggleChapterComplete = (chapterId: string) => {
    const updatedProject = {
      ...project,
      chapters: project.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, completed: !ch.completed } : ch
      ),
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作将永久删除该项目及其所有学习记录，无法恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Project Header */}
        <div className="bg-card border border-border p-6 mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{project.title}</h1>
          <p className="text-muted-foreground">{project.topic}</p>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{project.goal}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{project.timePerDay}分钟/天 · {project.durationDays}天</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">整体进度</span>
              <span className="font-medium text-foreground">
                {completedChapters}/{project.chapters.length} 章节完成
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Chapters List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground mb-4">学习章节</h2>
          {project.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={cn(
                "bg-card border border-border p-4 flex items-center gap-4 group",
                chapter.completed && "opacity-60"
              )}
            >
              <button
                onClick={() => toggleChapterComplete(chapter.id)}
                className="flex-shrink-0"
              >
                {chapter.completed ? (
                  <CheckCircle className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-foreground",
                  chapter.completed && "line-through"
                )}>
                  {chapter.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {chapter.description}
                </p>
              </div>

              <Link to={`/projects/${project.id}/learn/${chapter.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-4 h-4 mr-1" />
                  学习
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
