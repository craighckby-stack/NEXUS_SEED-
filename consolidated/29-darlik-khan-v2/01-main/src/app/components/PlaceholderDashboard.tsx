'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Placeholder } from '@/system/placeholders';

export function PlaceholderDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [filter, setFilter] = useState<'all' | 'filled' | 'unfilled'>('all');

  useEffect(() => {
    fetchStats();
    fetchPlaceholders();
  }, [filter]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/system/placeholders-route?action=stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPlaceholders = async () => {
    try {
      const filledParam = filter === 'all' ? '' : `&filled=${filter}`;
      const res = await fetch(`/api/system/placeholders-route?action=list${filledParam}`);
      const data = await res.json();
      setPlaceholders(data);
    } catch (error) {
      console.error('Failed to fetch placeholders:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-600';
      case 'HIGH': return 'bg-orange-600';
      case 'MEDIUM': return 'bg-blue-600';
      case 'LOW': return 'bg-gray-600';
      case 'RESEARCH': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'ai-infrastructure': return 'bg-cyan-600';
      case 'communication': return 'bg-green-600';
      case 'data-storage': return 'bg-blue-600';
      case 'security': return 'bg-red-700';
      case 'optimization': return 'bg-yellow-600';
      case 'utilities': return 'bg-indigo-600';
      case 'mathematics': return 'bg-pink-600';
      case 'meta-system': return 'bg-violet-600';
      case 'research': return 'bg-purple-700';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-400">{stats?.filled || 0}</p>
              <p className="text-sm text-gray-400">Filled</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-yellow-400">{stats?.unfilled || 0}</p>
              <p className="text-sm text-gray-400">Unfilled</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {stats ? Math.round((stats.filled / stats.total) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-400">Complete</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-600">
            <h3 className="text-lg font-semibold mb-4">By Priority</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="bg-red-600 px-3 py-1 rounded-full text-sm">
                Critical: {stats?.critical || 0}
              </div>
              <div className="bg-orange-600 px-3 py-1 rounded-full text-sm">
                High: {stats?.high || 0}
              </div>
              <div className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                Medium: {stats?.medium || 0}
              </div>
              <div className="bg-gray-600 px-3 py-1 rounded-full text-sm">
                Low: {stats?.low || 0}
              </div>
              <div className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                Research: {stats?.research || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('filled')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'filled' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Filled
        </button>
        <button
          onClick={() => setFilter('unfilled')}
          className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unfilled' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          Unfilled
        </button>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <ScrollArea className="h-[500px] rounded-md bg-gray-900/50 p-4">
            <div className="space-y-3">
              {placeholders.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No placeholders found
                </p>
              ) : (
                placeholders.map(p => (
                  <div key={p.id} className={`p-4 rounded-lg bg-gray-700/50 border-l-4 ${getPriorityColor(p.priority)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{p.title}</h4>
                        <p className="text-sm text-gray-400 font-mono">{p.file}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(p.priority)}>
                          {p.priority}
                        </Badge>
                        <Badge className={getCategoryBadgeColor(p.category)}>
                          {p.category.replace('-', ' ')}
                        </Badge>
                        <span className={`px-2 py-1 rounded text-xs font-mono ${p.filled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                          {p.filled ? 'Filled' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {p.dependencies.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-xs text-gray-400 mb-1">
                          Dependencies ({p.dependencies.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {p.dependencies.map(dep => (
                            <Badge key={dep} variant="outline" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm text-gray-300 mb-1">
                        <strong>Complexity:</strong> {p.estimatedComplexity}/5
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {p.instruction.trim().substring(0, 150)}...
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
