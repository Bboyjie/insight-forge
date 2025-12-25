import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { saveAuthUser, saveAuthToken, getAuthUser } from '@/lib/storage';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !isProcessingCallback) {
      handleOAuthCallback(code);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    setIsProcessingCallback(true);
    
    try {
      const redirectUri = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.functions.invoke('linuxdo-auth', {
        body: {
          action: 'exchange_code',
          code,
          redirectUri,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Save auth data
      saveAuthToken(data.accessToken);
      saveAuthUser(data.user);

      toast({
        title: '登录成功',
        description: `欢迎回来，${data.user.name || data.user.username}！`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: '登录失败',
        description: error instanceof Error ? error.message : '请重试',
        variant: 'destructive',
      });
      // Clear the code from URL
      navigate('/auth', { replace: true });
    } finally {
      setIsProcessingCallback(false);
    }
  };

  const handleLinuxDoLogin = async () => {
    setIsLoading(true);
    
    try {
      const redirectUri = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.functions.invoke('linuxdo-auth', {
        body: {
          action: 'get_auth_url',
          redirectUri,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Redirect to LinuxDo OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: '登录失败',
        description: error instanceof Error ? error.message : '请重试',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (isProcessingCallback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">正在登录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">因学</CardTitle>
          <CardDescription>
            基于 AI 的个人学习与成长助手
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLinuxDoLogin}
            disabled={isLoading}
            className="w-full h-12"
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在跳转...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                使用 LinuxDo 登录
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            登录即表示同意我们的服务条款和隐私政策
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
