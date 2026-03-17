'use client';

/**
 * AGI System - Simple Chat Interface
 * Splash screen -> Auto-init -> Chat with AGI
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Send,
  Loader2,
  Sparkles,
  Code,
  Zap,
  Database,
  GitBranch,
  Terminal,
  Wifi
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface InitStats {
  repos: number;
  files: number;
  patterns: number;
}

export default function AGIChat() {
  // State
  const [phase, setPhase] = useState<'splash' | 'loading' | 'chat'>('splash');
  const [loadingStatus, setLoadingStatus] = useState<string>('Connecting...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stats, setStats] = useState<InitStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add message helper
  const addMessage = useCallback((role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date()
    }]);
  }, []);

  // Send message via HTTP API
  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !isConnected || isTyping) return;
    
    const userMessage = inputMessage;
    addMessage('user', userMessage);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/agi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionIdRef.current
        })
      });

      const data = await response.json();

      if (data.success) {
        addMessage('assistant', data.response);
      } else {
        addMessage('system', `Error: ${data.error || 'Failed to get response'}`);
      }
    } catch (error) {
      addMessage('system', 'Error connecting to AGI. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isConnected, isTyping, addMessage]);

  // Quick action handler
  const handleQuickAction = useCallback((prompt: string) => {
    setInputMessage(prompt);
    setTimeout(() => {
      const inputEl = document.querySelector('input');
      if (inputEl) {
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      }
    }, 100);
  }, []);

  // Splash screen animation
  useEffect(() => {
    if (phase === 'splash') {
      const timer = setTimeout(() => setPhase('loading'), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize system
  useEffect(() => {
    if (phase !== 'loading') return;

    const initialize = async () => {
      try {
        setLoadingStatus('Initializing AGI Core...');
        setLoadingProgress(10);

        const initRes = await fetch('/api/agi/init');
        const initData = await initRes.json();

        if (initData.success) {
          setStats(initData.stats);
          setLoadingProgress(50);
          setLoadingStatus(`Loaded ${initData.stats.repos} repositories...`);

          await new Promise(r => setTimeout(r, 400));
          setLoadingProgress(70);
          setLoadingStatus(`Processing ${initData.stats.files} files...`);

          await new Promise(r => setTimeout(r, 400));
          setLoadingProgress(90);
          setLoadingStatus('Starting AGI...');
        }

        await new Promise(r => setTimeout(r, 300));
        setLoadingProgress(100);
        setLoadingStatus('Ready!');
        setIsConnected(true);

        setTimeout(() => setPhase('chat'), 500);

      } catch (error) {
        console.error('Initialization error:', error);
        setLoadingStatus('Error connecting. Retrying...');
        setTimeout(() => initialize(), 2000);
      }
    };

    initialize();
  }, [phase]);

  // Quick actions
  const quickActions = [
    { icon: Code, label: 'Generate code', prompt: 'Can you generate some code for me?' },
    { icon: Database, label: 'Analyze patterns', prompt: 'What patterns have you learned from my code?' },
    { icon: GitBranch, label: 'Improve my code', prompt: 'Can you suggest improvements for my repositories?' },
    { icon: Terminal, label: 'Run analysis', prompt: 'Run an analysis on all my repositories' },
  ];

  // Splash Screen
  if (phase === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="relative inline-block mb-8"
          >
            <Brain className="w-32 h-32 text-primary" />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0"
            >
              <Sparkles className="w-32 h-32 text-primary/30" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            AGI Core
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-muted-foreground"
          >
            Autonomous General Intelligence
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Loading Screen
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md w-full px-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-8"
          >
            <Brain className="w-20 h-20 text-primary mx-auto" />
          </motion.div>

          <h2 className="text-2xl font-semibold mb-6">{loadingStatus}</h2>

          <div className="w-full bg-secondary rounded-full h-2 mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 gap-4 mt-8"
            >
              <div className="bg-secondary/50 rounded-lg p-4">
                <GitBranch className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.repos}</p>
                <p className="text-xs text-muted-foreground">Repos</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <Database className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.files}</p>
                <p className="text-xs text-muted-foreground">Files</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <Zap className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.patterns}</p>
                <p className="text-xs text-muted-foreground">Patterns</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Chat Interface
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-primary" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-xl font-bold">AGI Core</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
          </div>

          {stats && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {stats.repos} repos
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                {stats.files} files
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto pr-4 max-h-[calc(100vh-280px)]">
          <div className="space-y-4 pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.role === 'system'
                      ? 'bg-secondary/50 border border-border'
                      : 'bg-secondary'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-secondary rounded-2xl p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mb-4 justify-center"
          >
            {quickActions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.prompt)}
                className="gap-2"
                disabled={!isConnected || isTyping}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </motion.div>
        )}

        {/* Input Area */}
        <div className="border-t pt-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!isConnected || isTyping}
              className="flex-1 h-12 text-base"
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected || isTyping}
              size="icon"
              className="h-12 w-12"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 py-3 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          AGI Core v1.0 • Autonomous Intelligence System
        </div>
      </footer>
    </div>
  );
}
