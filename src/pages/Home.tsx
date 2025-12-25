import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Target, Sparkles, ArrowRight } from 'lucide-react';
import { getAuthUser } from '@/lib/storage';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    const user = getAuthUser();
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const features = [
    {
      icon: Target,
      title: '目标驱动学习',
      description: 'AI 根据你的学习目标生成个性化学习路径，每个章节都有明确的学习目标',
    },
    {
      icon: Brain,
      title: '苏格拉底式对话',
      description: '通过启发式提问引导你思考，而非直接给出答案，真正理解知识',
    },
    {
      icon: Sparkles,
      title: '能力量化成长',
      description: '学习成果可视化，通过雷达图展示你在各个知识维度的成长',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              因学
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              基于 AI 的个人学习与成长助手，通过目标驱动的学习计划和苏格拉底式对话，
              帮助你真正理解和掌握知识
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-12 px-8">
                <Link to="/auth">
                  开始学习
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-foreground mb-12">
            为什么选择因学？
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            准备好开始你的学习之旅了吗？
          </h2>
          <p className="text-muted-foreground mb-8">
            立即登录，创建你的第一个学习项目
          </p>
          <Button asChild size="lg">
            <Link to="/auth">
              立即开始
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 因学. 基于 AI 的个人学习助手</p>
        </div>
      </footer>
    </div>
  );
}
