import {
  Bus,
  Wrench,
  Truck,
  GraduationCap,
  PhoneOff,
  CheckCircle2,
  RefreshCw,
  Bell,
  MessageSquare,
} from 'lucide-react';
import type { NotificationTarget, NotificationStatus } from '@/types';
import { useCurrentDispatch, useDispatchStore } from '@/store/useDispatchStore';
import { getNotificationStatusLabel } from '@/data/mockData';
import { getRelativeTime } from '@/utils';

const roleIcons: Record<string, typeof Bus> = {
  driver: Bus,
  repair: Wrench,
  tow: Truck,
  supervisor: GraduationCap,
  school: GraduationCap,
};

const statusStyles: Record<
  NotificationStatus,
  { bg: string; text: string; border: string; icon: typeof CheckCircle2 }
> = {
  notified: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/40',
    icon: Bell,
  },
  unreachable: {
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    border: 'border-red-500/40',
    icon: PhoneOff,
  },
  confirmed: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    icon: CheckCircle2,
  },
};

interface NotificationPanelProps {
  notifications: NotificationTarget[];
  compact?: boolean;
  onRecordCommunication?: (role: string, name: string, phone: string) => void;
}

export default function NotificationPanel({ notifications, compact = false, onRecordCommunication }: NotificationPanelProps) {
  const { updateNotificationStatus, renotify } = useDispatchStore();
  const dispatch = useCurrentDispatch();

  const confirmedCount = notifications.filter((n) => n.status === 'confirmed').length;
  const unreachableCount = notifications.filter((n) => n.status === 'unreachable').length;

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">暂无通知记录</p>
    );
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-4 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">已确认 {confirmedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-400">已通知 {notifications.filter((n) => n.status === 'notified').length}</span>
          </div>
          {unreachableCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-400">未接通 {unreachableCount}</span>
            </div>
          )}
        </div>
      )}

      {notifications.map((ntf) => {
        const Icon = roleIcons[ntf.role] || Bus;
        const StatusIcon = statusStyles[ntf.status].icon;
        const styles = statusStyles[ntf.status];

        return (
          <div
            key={ntf.id}
            className={`p-3 bg-slate-900/50 rounded-xl border ${styles.border}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.bg}`}>
                <Icon className={`w-4 h-4 ${styles.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-slate-400">{ntf.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${styles.bg} ${styles.text}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {getNotificationStatusLabel(ntf.status)}
                  </span>
                </div>
                <p className="text-sm font-medium text-white truncate">{ntf.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {ntf.phone} · {getRelativeTime(ntf.updatedAt)}
                </p>

                {dispatch && (
                  <div className="flex gap-1.5 mt-2.5">
                    <button
                      onClick={() => updateNotificationStatus(ntf.id, 'confirmed')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        ntf.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      已确认
                    </button>
                    <button
                      onClick={() => updateNotificationStatus(ntf.id, 'unreachable')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        ntf.status === 'unreachable'
                          ? 'bg-red-500/20 text-red-300 cursor-default'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-red-500/20 hover:text-red-300'
                      }`}
                    >
                      <PhoneOff className="w-3 h-3 inline mr-1" />
                      未接通
                    </button>
                    <button
                      onClick={() => renotify(ntf.id)}
                      className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-700/60 text-slate-300 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                      title="重新通知"
                    >
                      <RefreshCw className="w-3 h-3 inline mr-1" />
                      重发
                    </button>
                    {onRecordCommunication && (
                      <button
                        onClick={() => onRecordCommunication(ntf.role, ntf.name, ntf.phone)}
                        className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-700/60 text-slate-300 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                        title="记录沟通"
                      >
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        记录沟通
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
