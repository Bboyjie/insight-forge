import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getProject, saveProject, deleteProject } from '@/lib/storage';
import { ArrowLeft, Play, CheckCircle, Circle, Trash2, Clock, Target, ChevronDown, ChevronRight, Award } from 'lucide-react';
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
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

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

  // Calculate progress based on subchapters
  const totalSubChapters = project.chapters.reduce((acc, ch) => 
    acc + (ch.subChapters?.length || 1), 0
  );
  const completedSubChapters = project.chapters.reduce((acc, ch) => {
    if (ch.subChapters && ch.subChapters.length > 0) {
      return acc + ch.subChapters.filter(s => s.completed).length;
    }
    return acc + (ch.completed ? 1 : 0);
  }, 0);
  const progressPercent = totalSubChapters > 0 
    ? (completedSubChapters / totalSubChapters) * 100 
    : 0;

  const handleDelete = () => {
    deleteProject(project.id);
    toast({
      title: "项目已删除",
      description: `"${project.title}" 已被删除`,
    });
    navigate('/projects');
  };

  const toggleSubChapterComplete = (chapterId: string, subChapterId: string) => {
    const updatedProject = {
      ...project,
      chapters: project.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;
        
        const updatedSubChapters = ch.subChapters?.map(s =>
          s.id === subChapterId ? { ...s, completed: !s.completed } : s
        );
        
        const allSubCompleted = updatedSubChapters?.every(s => s.completed) ?? true;
        
        return { 
          ...ch, 
          subChapters: updatedSubChapters,
          completed: allSubCompleted,
        };
      }),
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  };

  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
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

          {/* Learning Objectives */}
          {project.learningObjectives && project.learningObjectives.length > 0 && (
            <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
              <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                学习目标
              </h3>
              <ul className="space-y-2">
                {project.learningObjectives.map((objective, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-medium">{i + 1}.</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">整体进度</span>
              <span className="font-medium text-foreground">
                {completedSubChapters}/{totalSubChapters} 子章节完成
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Chapters List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground mb-4">学习章节</h2>
          {project.chapters.map((chapter, index) => {
            const isExpanded = expandedChapters.has(chapter.id);
            const hasSubChapters = chapter.subChapters && chapter.subChapters.length > 0;
            const hasObjectives = chapter.objectives && chapter.objectives.length > 0;
            const subChapterProgress = hasSubChapters 
              ? chapter.subChapters!.filter(s => s.completed).length 
              : 0;

            return (
              <div
                key={chapter.id}
                className={cn(
                  "bg-card border border-border",
                  chapter.completed && "opacity-60"
                )}
              >
                {/* Main Chapter Row */}
                <div className="p-4 flex items-center gap-4 group">
                  <div className="flex-shrink-0">
                    {chapter.completed ? (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {(hasSubChapters || hasObjectives) && (
                        <button 
                          onClick={() => toggleChapterExpand(chapter.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <h3 className={cn(
                        "font-medium text-foreground",
                        chapter.completed && "line-through"
                      )}>
                        {chapter.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {chapter.description}
                    </p>
                    {hasSubChapters && (
                      <p className="text-xs text-muted-foreground mt-1">
                        进度：{subChapterProgress}/{chapter.subChapters!.length}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-muted/20">
                    {/* Chapter Objectives */}
                    {hasObjectives && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <Target className="w-3 h-3 text-primary" />
                          章节目标
                        </h4>
                        <ul className="space-y-1 ml-5">
                          {chapter.objectives!.map((obj, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sub Chapters */}
                    {hasSubChapters && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">子章节（点击学习）</h4>
                        <div className="space-y-2 ml-2">
                          {chapter.subChapters!.map((sub) => (
                            <div 
                              key={sub.id} 
                              className={cn(
                                "p-3 rounded-lg border border-border hover:border-primary/50 transition-colors",
                                sub.completed && "opacity-60 bg-muted/30"
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubChapterComplete(chapter.id, sub.id);
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    {sub.completed ? (
                                      <CheckCircle className="w-4 h-4 text-primary" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    )}
                                  </button>
                                  <span className={cn(
                                    "text-sm text-foreground truncate",
                                    sub.completed && "line-through"
                                  )}>
                                    {sub.title}
                                  </span>
                                </div>
                                
                                <Link to={`/projects/${project.id}/learn/${chapter.id}/${sub.id}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="flex-shrink-0"
                                  >
                                    <Play className="w-4 h-4 mr-1" />
                                    学习
                                  </Button>
                                </Link>
                              </div>
                              
                              {sub.objectives && sub.objectives.length > 0 && (
                                <div className="ml-6 mt-2 text-xs text-muted-foreground">
                                  目标: {sub.objectives.join(', ')}
                                </div>
                              )}
                              
                              {sub.skillRewards && sub.skillRewards.length > 0 && (
                                <div className="ml-6 mt-1 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-primary" />
                                  {sub.skillRewards.map((r, i) => (
                                    <span key={i} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                      {r.dimension} +{r.points}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}