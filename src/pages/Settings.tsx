import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLLMSettings, saveLLMSettings, LLMSettings } from '@/lib/storage';
import { Save, Eye, EyeOff, CheckCircle, Server, Key, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
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
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
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
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
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
                onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
                placeholder="gpt-4o / claude-3-5-sonnet"
              />
              <p className="text-xs text-muted-foreground">
                使用的模型名称
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={!settings.baseUrl || !settings.apiKey || !settings.modelName}
            >
              <Save className="w-4 h-4 mr-2" />
              保存设置
            </Button>
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
