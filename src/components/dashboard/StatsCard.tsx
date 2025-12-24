import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon, className }: StatsCardProps) {
  return (
    <div className={cn("bg-card border border-border p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}
