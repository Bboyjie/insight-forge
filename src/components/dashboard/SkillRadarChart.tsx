import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { SkillDimension } from '@/lib/storage';

interface SkillRadarChartProps {
  dimensions: SkillDimension[];
}

export function SkillRadarChart({ dimensions }: SkillRadarChartProps) {
  const data = dimensions.map(d => ({
    subject: d.name,
    value: d.score,
    fullMark: d.maxScore,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
              fill: 'hsl(var(--foreground))', 
              fontSize: 12,
              fontWeight: 500
            }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="能力值"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
