'use client';

import { Search, FileCode, Dna, Heart, Eye, Users, Upload } from 'lucide-react';
import { COLORS } from '@/lib/constants';

interface QuickActionsProps {
  onAction: (action: string) => void;
  disabled: boolean;
  pushStatus?: 'idle' | 'pushing' | 'success' | 'error';
}

const actions = [
  { id: 'scan', label: 'SCAN REPOSITORY', icon: Search, color: COLORS.cyan },
  { id: 'analyze', label: 'ANALYZE FILE', icon: FileCode, color: COLORS.gold },
  { id: 'propose', label: 'PROPOSE MUTATION', icon: Dna, color: COLORS.purple },
  { id: 'health', label: 'HEALTH CHECK', icon: Heart, color: COLORS.dalekRed },
  { id: 'saturation', label: 'VIEW SATURATION', icon: Eye, color: COLORS.electricBlue },
  { id: 'debate', label: 'DEBATE CHAMBER', icon: Users, color: COLORS.purple },
  { id: 'push-enhancements', label: 'PUSH ENHANCEMENTS', icon: Upload, color: COLORS.green },
];

export default function QuickActions({ onAction, disabled, pushStatus }: QuickActionsProps) {
  return (
    <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
      <div
        className="flex items-center gap-2 mb-2"
        style={{
          fontFamily: 'var(--font-orbitron), sans-serif',
          fontSize: '8px',
          letterSpacing: '0.15em',
          color: COLORS.textMuted,
        }}
      >
        <span>◉</span>
        <span>QUICK ACTIONS</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ id, label, icon: Icon, color }) => {
          const isPushing = id === 'push-enhancements' && pushStatus === 'pushing';
          const isActionDisabled = disabled || isPushing;

          return (
            <button
              key={id}
              onClick={() => onAction(id)}
              disabled={isActionDisabled}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-[10px] transition-all duration-200"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 500,
                letterSpacing: '0.05em',
                background: isActionDisabled ? '#1a1a1a' : `${color}06`,
                color: isActionDisabled ? '#333' : (pushStatus === 'success' && id === 'push-enhancements' ? COLORS.green : pushStatus === 'error' && id === 'push-enhancements' ? COLORS.dalekRed : color),
                border: `1px solid ${isActionDisabled ? '#1a1a1a' : `${color}25`}`,
                cursor: isActionDisabled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActionDisabled) {
                  e.currentTarget.style.background = `${color}15`;
                  e.currentTarget.style.boxShadow = `0 0 10px ${color}20, inset 0 0 20px ${color}05`;
                  e.currentTarget.style.borderColor = `${color}50`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActionDisabled) {
                  e.currentTarget.style.background = `${color}06`;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${color}25`;
                }
              }}
            >
              <Icon size={11} className={isPushing ? 'animate-spin' : ''} />
              <span>◉</span>
              {isPushing ? 'PUSHING...' : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
