import { Check, Clock, AlertTriangle } from 'lucide-react';
import type { TimelineNode } from '@/types';
import { formatTime } from '@/utils';

interface TimelineProps {
  nodes: TimelineNode[];
  onConfirm?: (nodeId: string) => void;
  showConfirmButton?: boolean;
}

const statusStyles = {
  completed: {
    dot: 'bg-emerald-500 border-emerald-400',
    line: 'bg-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  current: {
    dot: 'bg-blue-500 border-blue-400 animate-pulse',
    line: 'bg-slate-700',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
  pending: {
    dot: 'bg-slate-600 border-slate-500',
    line: 'bg-slate-700',
    text: 'text-slate-400',
    bg: 'bg-slate-800/50 border-slate-700/50',
  },
  overdue: {
    dot: 'bg-red-500 border-red-400 animate-pulse',
    line: 'bg-slate-700',
    text: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
  },
};

export default function Timeline({ nodes, onConfirm, showConfirmButton = false }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-700" />
      <div className="space-y-4">
        {nodes.map((node, index) => {
          const styles = statusStyles[node.status];
          const isLast = index === nodes.length - 1;
          const canConfirm = showConfirmButton && (node.status === 'current' || node.status === 'overdue');

          return (
            <div key={node.id} className="relative flex gap-4">
              <div className="relative z-10">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${styles.dot} bg-slate-900`}
                >
                  {node.status === 'completed' ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : node.status === 'overdue' ? (
                    <AlertTriangle className="w-5 h-5 text-white" />
                  ) : node.status === 'current' ? (
                    <Clock className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-sm font-medium text-slate-400">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full ${
                      node.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    style={{ height: 'calc(100% + 16px - 40px)' }}
                  />
                )}
              </div>

              <div className={`flex-1 pb-4`}>
                <div
                  className={`p-4 rounded-xl border ${styles.bg} transition-all duration-300 ${
                    node.status === 'current' ? 'ring-2 ring-blue-500/30' : ''
                  } ${node.status === 'overdue' ? 'ring-2 ring-red-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${styles.text}`}>{node.title}</h4>
                        {node.status === 'overdue' && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                            已超时
                          </span>
                        )}
                        {node.status === 'current' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium">
                            进行中
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{node.description}</p>
                      {node.time && (
                        <p className="text-xs text-slate-500 font-mono">
                          完成时间：{formatTime(node.time)}
                        </p>
                      )}
                      {node.remark && (
                        <p className="text-xs text-slate-400 mt-2 italic">
                          备注：{node.remark}
                        </p>
                      )}
                      {node.expectedMinutes && node.status === 'pending' && (
                        <p className="text-xs text-slate-500 font-mono">
                          预计：{node.expectedMinutes} 分钟
                        </p>
                      )}
                    </div>

                    {canConfirm && onConfirm && (
                      <button
                        onClick={() => onConfirm(node.id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                      >
                        确认完成
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
