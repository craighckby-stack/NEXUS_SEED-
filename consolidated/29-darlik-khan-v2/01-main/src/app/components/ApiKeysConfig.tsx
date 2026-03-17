'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';

export function ApiKeysConfig() {
  const [apiKey, setApiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Load saved values from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('NEXT_PUBLIC_LLM_API_KEY') || '';
    const savedGithubToken = localStorage.getItem('GITHUB_TOKEN') || '';
    const savedRepoOwner = localStorage.getItem('GITHUB_REPO_OWNER') || '';
    const savedRepoName = localStorage.getItem('GITHUB_REPO_NAME') || '';

    setApiKey(savedApiKey);
    setGithubToken(savedGithubToken);
    setRepoOwner(savedRepoOwner);
    setRepoName(savedRepoName);
  }, []);

  const handleSave = () => {
    if (!apiKey) {
      toast({
        title: 'Missing API Key',
        description: 'Please enter your Gemini API key',
        variant: 'destructive'
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('NEXT_PUBLIC_LLM_API_KEY', apiKey);

    if (githubToken) {
      localStorage.setItem('GITHUB_TOKEN', githubToken);
    }

    if (repoOwner) {
      localStorage.setItem('GITHUB_REPO_OWNER', repoOwner);
    }

    if (repoName) {
      localStorage.setItem('GITHUB_REPO_NAME', repoName);
    }

    setIsSaved(true);
    toast({
      title: 'API Keys Saved',
      description: 'Your credentials have been saved to browser storage',
    });

    // Hide success message after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('NEXT_PUBLIC_LLM_API_KEY');
    localStorage.removeItem('GITHUB_TOKEN');
    localStorage.removeItem('GITHUB_REPO_OWNER');
    localStorage.removeItem('GITHUB_REPO_NAME');

    setApiKey('');
    setGithubToken('');
    setRepoOwner('');
    setRepoName('');

    toast({
      title: 'Keys Cleared',
      description: 'All saved API keys have been removed',
      variant: 'destructive'
    });
  };

  const handleResetDefaults = () => {
    setRepoOwner('craighckby-stack');
    setRepoName('darlik-khan-v2');

    toast({
      title: 'Reset to Defaults',
      description: 'Repository settings reset to defaults',
    });
  };

  const handleGenerateTest = async () => {
    try {
      // Test if we can load environment variables
      const response = await fetch('/api/test');
      const data = await response.json();

      toast({
        title: 'System Test Complete',
        description: data.message || 'System components are accessible',
        variant: data.status === 'success' ? 'default' : 'destructive'
      });

      if (data.status === 'success') {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Could not test system components',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Save className="w-5 h-5" />
              API Keys Configuration
            </CardTitle>
            <CardDescription>
              Add your Gemini API key and GitHub token to enable evolution
            </CardDescription>
          </div>
          <Button
            onClick={handleGenerateTest}
            variant="outline"
            size="sm"
            disabled={isSaved}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gemini API Key */}
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-sm font-medium">
            Gemini API Key <span className="text-red-400">*</span>
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="Paste your Gemini API key here..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Get your free key from{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Google AI Studio
            </a>
            {' '}or{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Google Makersuite
            </a>
          </p>
        </div>

        {/* GitHub Token */}
        <div className="space-y-2">
          <Label htmlFor="github-token" className="text-sm font-medium">
            GitHub Token <span className="text-red-400">*</span>
          </Label>
          <Input
            id="github-token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Get your token from{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              GitHub Settings
            </a>
            {' '}• Generate a "classic" token with "repo" scope
          </p>
        </div>

        {/* Repository Owner */}
        <div className="space-y-2">
          <Label htmlFor="repo-owner" className="text-sm font-medium">
            Repository Owner
          </Label>
          <Input
            id="repo-owner"
            type="text"
            placeholder="your-username"
            value={repoOwner}
            onChange={(e) => setRepoOwner(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Your GitHub username (default: craighckby-stack)
          </p>
        </div>

        {/* Repository Name */}
        <div className="space-y-2">
          <Label htmlFor="repo-name" className="text-sm font-medium">
            Repository Name
          </Label>
          <Input
            id="repo-name"
            type="text"
            placeholder="your-repo-name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-400">
            Repository name (default: darlik-khan-v2)
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaved}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSaved ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Keys
              </>
            )}
          </Button>
          <Button
            onClick={handleResetDefaults}
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600"
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleClear}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            Clear All
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-md bg-blue-900/20 border border-blue-800/30">
          <p className="text-sm text-blue-300 mb-2">
            <strong className="text-white">💡 How This Works:</strong>
          </p>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Keys are saved to browser localStorage (safe and private)</li>
            <li>• Refresh page or click "Test System" to apply keys</li>
            <li>• Keys are only used by your browser, never sent to server</li>
            <li>• GitHub token needs "repo" scope for commits</li>
          </ul>
        </div>

        {/* Test Button */}
        <div className="mt-4">
          <Button
            onClick={handleGenerateTest}
            variant="outline"
            className="w-full bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30"
            disabled={isSaved}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Test System Components
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
