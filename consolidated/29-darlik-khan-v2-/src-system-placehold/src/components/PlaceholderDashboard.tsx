'use client';

import { useState, useEffect } from 'react';
import type { Placeholder } from '@/system/placeholders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      const res = await fetch('/api/system/placeholders?action=stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch placeholder stats:', error);
    }
  };

  const fetchPlaceholders = async () => {
    try {
      const filledParam = filter === 'all' ? '' : `&filled=${filter === 'filled'}`;
      const res = await fetch(`/api/system/placeholders?action=list${filledParam}`);
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

  if (!stats) return <div className="text-white">Loading placeholder stats...</div>;

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Filled" value={stats.filled} color="green" />
        <StatCard label="Unfilled" value={stats.unfilled} color="yellow" />
        <StatCard
          label="Progress"
          value={`${Math.round((stats.filled / stats.total) * 100)}%`}
        />
      </div>

      {/* Priority Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">By Priority</h3>
        <div className="flex gap-2 flex-wrap">
          <PriorityBadge label="Critical" count={stats.critical} color="red" />
          <PriorityBadge label="High" count={stats.high} color="orange" />
          <PriorityBadge label="Medium" count={stats.medium} color="blue" />
          <PriorityBadge label="Low" count={stats.low} color="gray" />
          <PriorityBadge label="Research" count={stats.research} color="purple" />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded mr-2 ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('filled')}
          className={`px-4 py-2 rounded mr-2 ${filter === 'filled' ? 'bg-green-600' : 'bg-gray-700'}`}
        >
          Filled
        </button>
        <button
          onClick={() => setFilter('unfilled')}
          className={`px-4 py-2 rounded ${filter === 'unfilled' ? 'bg-yellow-600' : 'bg-gray-700'}`}
        >
          Unfilled
        </button>
      </div>

      {/* Placeholder List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto rounded-lg bg-gray-900/50 p-4">
        {placeholders.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No placeholders match filter</p>
        ) : (
          placeholders.map(p => (
            <PlaceholderCard key={p.id} placeholder={p} />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }: { label: string; value: number; color?: string }) {
  const colorClass = {
    blue: 'bg-blue-900',
    green: 'bg-green-900',
    yellow: 'bg-yellow-900',
    red: 'bg-red-900'
  }[color];

  return (
    <div className={`${colorClass} p-4 rounded`}>
      <div className="text-sm opacity-75">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function PriorityBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClass = {
    red: 'bg-red-600',
    orange: 'bg-orange-600',
    blue: 'bg-blue-600',
    gray: 'bg-gray-600',
    purple: 'bg-purple-600'
  }[color];

  return (
    <div className={`${colorClass} px-3 py-1 rounded-full text-sm`}>
      {label}: {count}
    </div>
  );
}

function PlaceholderCard({ placeholder }: { placeholder: Placeholder }) {
  const priorityColor = {
    CRITICAL: 'border-red-500',
    HIGH: 'border-orange-500',
    MEDIUM: 'border-blue-500',
    LOW: 'border-gray-500',
    RESEARCH: 'border-purple-500'
  }[placeholder.priority];

  return (
    <div className={`border-l-4 ${priorityColor} bg-gray-800 p-4 rounded`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold">{placeholder.title}</h4>
          <p className="text-sm text-gray-400">{placeholder.file}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${placeholder.filled ? 'bg-green-600' : 'bg-gray-600'}`}>
            {placeholder.filled ? 'Filled' : 'Unfilled'}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-gray-700">
            {placeholder.category}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-gray-700">
            {placeholder.priority}
          </span>
        </div>
      </div>

      {placeholder.dependencies.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">
          Dependencies: {placeholder.dependencies.join(', ')}
        </div>
      )}
    </div>
  );
}
