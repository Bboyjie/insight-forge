import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLLMSettings, saveLLMSettings, LLMSettings } from '@/lib/storage';
import { Save, Eye, EyeOff, CheckCircle, Server, Key, Cpu, Loader2, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [settings, setSettings] = useState<LLMSettings>({
    baseUrl: '',
    apiKey: '',
    modelName: '',
  });

  useEffect(() => {
    const saved = getLLMSettings();
    if (saved) {
      setSettings(saved);
    }
  }, []);

  const handleSave = () => {
    saveLLMSettings(settings);
    toast({
      title: "设置已保存",
      description: "API 配置已更新",
    });
  };

  const handleTestConnection = async () => {
    if (!settings.baseUrl || !settings.apiKey || !settings.modelName) {
      toast({
        title: "请填写完整配置",
        description: "Base URL、API Key 和 Model Name 都是必填项",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-connection', {
        body: {
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          modelName: settings.modelName,
        },
      });

      if (error) {
        setTestResult({ success: false, message: error.message });
        toast({
          title: "连接测试失败",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.success) {
        setTestResult({ success: true, message: data.message });
        toast({
          title: "连接成功",
          description: `模型 ${data.model} 已准备就绪`,
        });
      } else {
        setTestResult({ success: false, message: data.error });
        toast({
          title: "连接失败",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      setTestResult({ success: false, message });
      toast({
        title: "测试失败",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = settings.baseUrl && settings.apiKey && settings.modelName;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">设置</h1>
          <p className="text-muted-foreground mt-1">配置 AI 模型接口</p>
        </div>

        <div className="bg-card border border-border p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
            <div className={`w-10 h-10 flex items-center justify-center ${isConfigured ? 'bg-primary/10' : 'bg-muted'}`}>
              {isConfigured ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : (
                <Server className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {isConfigured ? 'API 已配置' : 'API 未配置'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isConfigured ? '你可以开始使用 AI 功能' : '请填写以下信息以启用 AI 功能'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                Base URL
              </Label>
              <Input
                id="baseUrl"
                value={settings.baseUrl}
                onChange={(e) => {
                  setSettings({ ...settings, baseUrl: e.target.value });
                  setTestResult(null);
                }}
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                API 服务地址，支持 OpenAI 格式兼容接口
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => {
                    setSettings({ ...settings, apiKey: e.target.value });
                    setTestResult(null);
                  }}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                你的 API 密钥会安全地存储在本地
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelName" className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Model Name
              </Label>
              <Input
                id="modelName"
                value={settings.modelName}
                onChange={(e) => {
                  setSettings({ ...settings, modelName: e.target.value });
                  setTestResult(null);
                }}
                placeholder="gpt-4o / claude-3-5-sonnet"
              />
              <p className="text-xs text-muted-foreground">
                使用的模型名称
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded ${
                testResult.success 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleTestConnection}
                disabled={!isConfigured || isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    测试连接
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex-1"
                disabled={!isConfigured}
              >
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </Button>
            </div>
          </div>
        </div>

        {/* Data Section */}
        <div className="mt-8 bg-card border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">数据管理</h3>
          <p className="text-sm text-muted-foreground mb-4">
            所有数据都存储在你的设备本地，不会上传到任何服务器。
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              导出数据
            </Button>
            <Button variant="outline" size="sm">
              导入数据
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
