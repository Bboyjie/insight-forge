import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Sparkles, Plus, X } from 'lucide-react';

interface CreateProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
}

export interface ProjectFormData {
  topic: string;
  goal: string;
  customGoal?: string;
  level: number;
  timePerDay: number;
  durationDays: number;
}

const goalOptions = [
  { value: '学术研究', label: '学术研究' },
  { value: '兴趣了解', label: '兴趣了解' },
  { value: '考试备考', label: '考试备考' },
  { value: '技能提升', label: '技能提升' },
  { value: 'custom', label: '自定义' },
];

const levelLabels = ['零基础', '入门', '进阶', '专家'];

export function CreateProjectForm({ onSubmit, isLoading }: CreateProjectFormProps) {
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('兴趣了解');
  const [customGoal, setCustomGoal] = useState('');
  const [level, setLevel] = useState([1]);
  const [timePerDay, setTimePerDay] = useState([30]);
  const [durationDays, setDurationDays] = useState([30]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalGoal = goal === 'custom' ? customGoal : goal;
    onSubmit({
      topic,
      goal: finalGoal,
      customGoal: goal === 'custom' ? customGoal : undefined,
      level: level[0],
      timePerDay: timePerDay[0],
      durationDays: durationDays[0],
    });
  };

  const isCustomGoal = goal === 'custom';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <Label htmlFor="topic" className="text-base font-medium">学习主题</Label>
        <Textarea
          id="topic"
          placeholder="例如：维特根斯坦哲学、机器学习基础、日本历史..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="min-h-[100px] resize-none"
          required
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">学习目的</Label>
        <RadioGroup value={goal} onValueChange={setGoal} className="grid grid-cols-2 gap-3">
          {goalOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
        
        {isCustomGoal && (
          <div className="mt-3">
            <Input
              placeholder="请输入你的学习目的..."
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              required={isCustomGoal}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">当前基础</Label>
          <span className="text-sm text-primary font-medium">{levelLabels[level[0]]}</span>
        </div>
        <Slider
          value={level}
          onValueChange={setLevel}
          min={0}
          max={3}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {levelLabels.map((label, i) => (
            <span key={label} className={level[0] === i ? 'text-primary font-medium' : ''}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">每日学习时间</Label>
          <span className="text-sm text-primary font-medium">{timePerDay[0]} 分钟</span>
        </div>
        <Slider
          value={timePerDay}
          onValueChange={setTimePerDay}
          min={15}
          max={120}
          step={15}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">学习周期</Label>
          <span className="text-sm text-primary font-medium">{durationDays[0]} 天</span>
        </div>
        <Slider
          value={durationDays}
          onValueChange={setDurationDays}
          min={7}
          max={90}
          step={7}
          className="w-full"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-base"
        disabled={!topic.trim() || (isCustomGoal && !customGoal.trim()) || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            正在生成学习计划...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            生成学习计划
          </>
        )}
      </Button>
    </form>
  );
}
