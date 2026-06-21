import type { RiskLevel } from '@/types';
import { getRiskLabel } from '@/data/mockData';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const riskColors: Record<RiskLevel, { bg: string; border: string; text: string; glow: string }> = {
  red: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/30',
  },
  yellow: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
  },
  green: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/30',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export default function RiskBadge({ level, size = 'md', pulse = false }: RiskBadgeProps) {
  const colors = riskColors[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses[size]} font-medium ${
        pulse ? 'animate-pulse shadow-lg ' + colors.glow : ''
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          level === 'red'
            ? 'bg-red-500'
            : level === 'yellow'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        } ${pulse ? 'animate-ping absolute' : ''}`}
      />
      <span
        className={`w-2 h-2 rounded-full ${
          level === 'red'
            ? 'bg-red-500'
            : level === 'yellow'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />
      {getRiskLabel(level)}
    </span>
  );
}
