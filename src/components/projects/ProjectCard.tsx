import { Link } from 'react-router-dom';
import { ChevronRight, Clock, Target } from 'lucide-react';
import { StudyProject } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

interface ProjectCardProps {
  project: StudyProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const completedChapters = project.chapters.filter(c => c.completed).length;
  const progressPercent = project.chapters.length > 0 
    ? (completedChapters / project.chapters.length) * 100 
    : 0;

  return (
    <Link 
      to={`/projects/${project.id}`}
      className="block bg-card border border-border p-6 hover:border-primary transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {project.topic}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          <span>{project.goal}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{project.timePerDay}分钟/天</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">学习进度</span>
          <span className="text-foreground font-medium">
            {completedChapters}/{project.chapters.length} 章节
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </Link>
  );
}
