import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getLLMSettings, 
  saveLLMSettings, 
  LLMSettings,
  getProjects,
  saveProjects,
  getJournals,
  saveJournals,
  getUserProfile,
  saveUserProfile,
  StudyProject,
  JournalEntry,
  UserProfile
} from '@/lib/storage';
import { 
  Save, Eye, EyeOff, CheckCircle, Server, Key, Cpu, Loader2, Zap, AlertCircle,
  Download, Upload, FileJson, Database, BookOpen, FileText, User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportData {
  version: string;
  exportedAt: string;
  llmSettings?: LLMSettings;
  projects?: StudyProject[];
  journals?: JournalEntry[];
  userProfile?: UserProfile;
}

export default function Settings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [settings, setSettings] = useState<LLMSettings>({
    baseUrl: '',
    apiKey: '',
    modelName: '',
  });

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    llmSettings: true,
    projects: true,
    journals: true,
    userProfile: true,
  });

  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importOptions, setImportOptions] = useState({
    llmSettings: true,
    projects: true,
    journals: true,
    userProfile: true,
  });

  // Data stats
  const [dataStats, setDataStats] = useState({
    projects: 0,
    journals: 0,
  });

  useEffect(() => {
    const saved = getLLMSettings();
    if (saved) {
      setSettings(saved);
    }
    // Load data stats
    setDataStats({
      projects: getProjects().length,
      journals: getJournals().length,
    });
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

  const handleExport = () => {
    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };

    if (exportOptions.llmSettings) {
      const llm = getLLMSettings();
      if (llm) exportData.llmSettings = llm;
    }
    if (exportOptions.projects) {
      exportData.projects = getProjects();
    }
    if (exportOptions.journals) {
      exportData.journals = getJournals();
    }
    if (exportOptions.userProfile) {
      exportData.userProfile = getUserProfile();
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yinxue-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
    toast({
      title: "导出成功",
      description: "数据已保存到文件",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ExportData;
        
        // Validate data format
        if (!data.version || !data.exportedAt) {
          throw new Error('无效的备份文件格式');
        }

        setImportData(data);
        setImportOptions({
          llmSettings: !!data.llmSettings,
          projects: !!data.projects?.length,
          journals: !!data.journals?.length,
          userProfile: !!data.userProfile,
        });
        setShowImportDialog(true);
      } catch (err) {
        toast({
          title: "文件读取失败",
          description: err instanceof Error ? err.message : '请选择有效的备份文件',
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!importData) return;

    let importedCount = { settings: false, projects: 0, journals: 0, profile: false };

    if (importOptions.llmSettings && importData.llmSettings) {
      saveLLMSettings(importData.llmSettings);
      setSettings(importData.llmSettings);
      importedCount.settings = true;
    }

    if (importOptions.projects && importData.projects?.length) {
      const existingProjects = getProjects();
      const existingIds = new Set(existingProjects.map(p => p.id));
      const newProjects = importData.projects.filter(p => !existingIds.has(p.id));
      saveProjects([...existingProjects, ...newProjects]);
      importedCount.projects = newProjects.length;
    }

    if (importOptions.journals && importData.journals?.length) {
      const existingJournals = getJournals();
      const existingIds = new Set(existingJournals.map(j => j.id));
      const newJournals = importData.journals.filter(j => !existingIds.has(j.id));
      saveJournals([...existingJournals, ...newJournals]);
      importedCount.journals = newJournals.length;
    }

    if (importOptions.userProfile && importData.userProfile) {
      const currentProfile = getUserProfile();
      // Merge profiles - take the higher scores
      const mergedProfile: UserProfile = {
        ...currentProfile,
        dimensions: importData.userProfile.dimensions.map(dim => {
          const existing = currentProfile.dimensions.find(d => d.name === dim.name);
          return existing && existing.score > dim.score ? existing : dim;
        }),
        totalLearningMinutes: Math.max(currentProfile.totalLearningMinutes, importData.userProfile.totalLearningMinutes),
        completedChapters: Math.max(currentProfile.completedChapters, importData.userProfile.completedChapters),
      };
      saveUserProfile(mergedProfile);
      importedCount.profile = true;
    }

    // Update stats
    setDataStats({
      projects: getProjects().length,
      journals: getJournals().length,
    });

    setShowImportDialog(false);
    setImportData(null);

    const messages: string[] = [];
    if (importedCount.settings) messages.push('API设置');
    if (importedCount.projects > 0) messages.push(`${importedCount.projects}个学习项目`);
    if (importedCount.journals > 0) messages.push(`${importedCount.journals}篇日记`);
    if (importedCount.profile) messages.push('用户画像');

    toast({
      title: "导入成功",
      description: messages.length > 0 ? `已导入: ${messages.join(', ')}` : '没有新数据需要导入',
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
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">数据管理</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            所有数据都存储在你的设备本地，不会上传到任何服务器。你可以导出数据进行备份或迁移到其他设备。
          </p>

          {/* Data Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">学习项目</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{dataStats.projects}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">日记</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{dataStats.journals}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowExportDialog(true)}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              导入数据
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              导出数据
            </DialogTitle>
            <DialogDescription>
              选择要导出的数据类型，导出的文件可用于备份或迁移到其他设备。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="export-settings"
                checked={exportOptions.llmSettings}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, llmSettings: !!checked })
                }
              />
              <Label htmlFor="export-settings" className="flex items-center gap-2 cursor-pointer">
                <Key className="w-4 h-4 text-muted-foreground" />
                API 设置
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="export-projects"
                checked={exportOptions.projects}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, projects: !!checked })
                }
              />
              <Label htmlFor="export-projects" className="flex items-center gap-2 cursor-pointer">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                学习项目 ({dataStats.projects}个)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="export-journals"
                checked={exportOptions.journals}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, journals: !!checked })
                }
              />
              <Label htmlFor="export-journals" className="flex items-center gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-muted-foreground" />
                日记 ({dataStats.journals}篇)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="export-profile"
                checked={exportOptions.userProfile}
                onCheckedChange={(checked) => 
                  setExportOptions({ ...exportOptions, userProfile: !!checked })
                }
              />
              <Label htmlFor="export-profile" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4 text-muted-foreground" />
                用户画像 (能力雷达)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              取消
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              导入数据
            </DialogTitle>
            <DialogDescription>
              备份文件创建于: {importData?.exportedAt ? new Date(importData.exportedAt).toLocaleString('zh-CN') : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {importData?.llmSettings && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="import-settings"
                  checked={importOptions.llmSettings}
                  onCheckedChange={(checked) => 
                    setImportOptions({ ...importOptions, llmSettings: !!checked })
                  }
                />
                <Label htmlFor="import-settings" className="flex items-center gap-2 cursor-pointer">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  API 设置 (将覆盖当前设置)
                </Label>
              </div>
            )}

            {importData?.projects && importData.projects.length > 0 && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="import-projects"
                  checked={importOptions.projects}
                  onCheckedChange={(checked) => 
                    setImportOptions({ ...importOptions, projects: !!checked })
                  }
                />
                <Label htmlFor="import-projects" className="flex items-center gap-2 cursor-pointer">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  学习项目 ({importData.projects.length}个，跳过已存在的)
                </Label>
              </div>
            )}

            {importData?.journals && importData.journals.length > 0 && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="import-journals"
                  checked={importOptions.journals}
                  onCheckedChange={(checked) => 
                    setImportOptions({ ...importOptions, journals: !!checked })
                  }
                />
                <Label htmlFor="import-journals" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  日记 ({importData.journals.length}篇，跳过已存在的)
                </Label>
              </div>
            )}

            {importData?.userProfile && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="import-profile"
                  checked={importOptions.userProfile}
                  onCheckedChange={(checked) => 
                    setImportOptions({ ...importOptions, userProfile: !!checked })
                  }
                />
                <Label htmlFor="import-profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4 text-muted-foreground" />
                  用户画像 (合并，保留较高分数)
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false);
              setImportData(null);
            }}>
              取消
            </Button>
            <Button onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
