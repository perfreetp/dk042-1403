import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  Bell,
  MessageSquare,
  CheckCircle2,
  Circle,
  Loader2,
  Route,
  MapPin,
  Users,
  ChevronRight,
  Bus,
  Wrench,
  Truck,
  GraduationCap,
  PhoneOff,
  RefreshCw,
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useDispatchStore } from '@/store/useDispatchStore';
import RiskBadge from '@/components/RiskBadge';
import { getRelativeTime, formatDateTimeWithSeconds, communicationRoleColors } from '@/utils';
import { getDispatchStatusLabel, getFaultTypeLabel, getNotificationStatusLabel } from '@/data/mockData';
import type { Incident, DispatchOrder, NotificationTarget, CommunicationRecord } from '@/types';

const ntfRoleIcons: Record<string, typeof Bus> = {
  driver: Bus,
  repair: Wrench,
  tow: Truck,
  supervisor: GraduationCap,
  school: GraduationCap,
};

const ntfStatusStyles: Record<string, { bg: string; text: string }> = {
  notified: { bg: 'bg-blue-500/15', text: 'text-blue-300' },
  unreachable: { bg: 'bg-red-500/15', text: 'text-red-300' },
  confirmed: { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
};

interface HandoverItem {
  incident: Incident;
  dispatch: DispatchOrder | undefined;
  overdueNodeCount: number;
  unconfirmedNotifications: NotificationTarget[];
  recentCommunications: CommunicationRecord[];
  priority: number;
}

function computePriority(item: HandoverItem): number {
  let p = 0;
  if (item.incident.riskLevel === 'red') p += 100;
  else if (item.incident.riskLevel === 'yellow') p += 50;
  p += item.overdueNodeCount * 30;
  p += item.unconfirmedNotifications.length * 15;
  if (!item.dispatch) p += 40;
  if (item.incident.status === 'pending') p += 20;
  return p;
}

export default function ShiftHandover() {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();
  const { getDispatchByIncident, setCurrentDispatch, recomputeOverdue } = useDispatchStore();

  const handoverItems = useMemo(() => {
    const items: HandoverItem[] = incidents
      .filter((i) => i.status !== 'completed')
      .map((incident) => {
        const dispatch = getDispatchByIncident(incident.id);
        const overdueNodeCount = dispatch
          ? dispatch.timelineNodes.filter((n) => n.status === 'overdue').length
          : 0;
        const unconfirmedNotifications = dispatch
          ? dispatch.notifications.filter((n) => n.status !== 'confirmed')
          : [];
        const recentCommunications = dispatch
          ? dispatch.communications.slice(0, 3)
          : [];
        const item: HandoverItem = {
          incident,
          dispatch,
          overdueNodeCount,
          unconfirmedNotifications,
          recentCommunications,
          priority: 0,
        };
        item.priority = computePriority(item);
        return item;
      });

    items.sort((a, b) => b.priority - a.priority);
    return items;
  }, [incidents, getDispatchByIncident]);

  const summary = useMemo(() => {
    const allDispatches = incidents
      .filter((i) => i.status !== 'completed')
      .map((i) => getDispatchByIncident(i.id))
      .filter(Boolean) as DispatchOrder[];

    const totalOverdue = allDispatches.reduce(
      (sum, d) => sum + d.timelineNodes.filter((n) => n.status === 'overdue').length,
      0
    );
    const totalUnconfirmed = allDispatches.reduce(
      (sum, d) => sum + d.notifications.filter((n) => n.status !== 'confirmed').length,
      0
    );
    const totalUnreachable = allDispatches.reduce(
      (sum, d) => sum + d.notifications.filter((n) => n.status === 'unreachable').length,
      0
    );
    const recentComms = allDispatches
      .flatMap((d) => d.communications)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      activeCount: incidents.filter((i) => i.status !== 'completed').length,
      highRiskCount: incidents.filter((i) => i.status !== 'completed' && i.riskLevel === 'red').length,
      noDispatchCount: incidents.filter((i) => i.status !== 'completed' && !getDispatchByIncident(i.id)).length,
      totalOverdue,
      totalUnconfirmed,
      totalUnreachable,
      recentComms,
    };
  }, [incidents, getDispatchByIncident]);

  const handleGoTracking = (incidentId: string) => {
    const incident = incidents.find((i) => i.id === incidentId);
    if (incident) {
      useIncidentStore.getState().setCurrentIncident(incidentId);
    }
    const dispatch = getDispatchByIncident(incidentId);
    if (dispatch) setCurrentDispatch(dispatch.id);
    navigate('/tracking');
  };

  const handleGoResources = (incidentId: string) => {
    useIncidentStore.getState().setCurrentIncident(incidentId);
    navigate('/resources');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
          </div>
          交接班视图
        </h2>
        <p className="text-slate-400">下一班值班员快速掌握当前进行中任务的全貌</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.activeCount}</p>
              <p className="text-xs text-slate-400">进行中</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.highRiskCount}</p>
              <p className="text-xs text-slate-400">高风险</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.noDispatchCount}</p>
              <p className="text-xs text-slate-400">未派单</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalOverdue}</p>
              <p className="text-xs text-slate-400">超时节点</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalUnconfirmed}</p>
              <p className="text-xs text-slate-400">未确认通知</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <PhoneOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalUnreachable}</p>
              <p className="text-xs text-slate-400">未接通</p>
            </div>
          </div>
        </div>
      </div>

      {handoverItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">当前无进行中任务</h3>
          <p className="text-slate-400">所有救援任务已完成，可安心交接</p>
        </div>
      ) : (
        <div className="space-y-4">
          {handoverItems.map((item, index) => {
            const { incident, dispatch, overdueNodeCount, unconfirmedNotifications, recentCommunications } = item;
            const completedNodes = dispatch?.timelineNodes.filter((n) => n.status === 'completed').length || 0;
            const totalNodes = dispatch?.timelineNodes.length || 0;
            const confirmedNtf = dispatch?.notifications.filter((n) => n.status === 'confirmed').length || 0;
            const totalNtf = dispatch?.notifications.length || 0;

            return (
              <div
                key={incident.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        index === 0
                          ? 'bg-red-500/20 text-red-400'
                          : index < 3
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-600/30 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className="font-semibold text-white">{incident.plateNumber}</h4>
                        <RiskBadge level={incident.riskLevel} size="sm" />
                        {overdueNodeCount > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                            {overdueNodeCount}超时
                          </span>
                        )}
                        {!dispatch && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                            未派单
                          </span>
                        )}
                        {unconfirmedNotifications.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium">
                            {unconfirmedNotifications.length}未确认
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                        {incident.routeLabel && (
                          <span className="flex items-center gap-1">
                            <Route className="w-3.5 h-3.5" />
                            {incident.routeLabel}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {incident.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {incident.studentCount}人
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {getRelativeTime(incident.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {dispatch ? (
                      <button
                        onClick={() => handleGoTracking(incident.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                      >
                        查看跟踪
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGoResources(incident.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                      >
                        去匹配
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {dispatch && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          处置进度
                        </p>
                        <span className="text-xs text-white font-mono">{completedNodes}/{totalNodes}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            overdueNodeCount > 0
                              ? 'bg-gradient-to-r from-red-500 to-amber-500'
                              : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                          }`}
                          style={{ width: `${totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        调度状态：{getDispatchStatusLabel(dispatch.status)}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-2">
                        <Bell className="w-3.5 h-3.5" />
                        通知确认 {confirmedNtf}/{totalNtf}
                      </p>
                      {unconfirmedNotifications.length > 0 ? (
                        <div className="space-y-1.5">
                          {unconfirmedNotifications.map((ntf) => {
                            const Icon = ntfRoleIcons[ntf.role] || Bus;
                            const styles = ntfStatusStyles[ntf.status] || ntfStatusStyles.notified;
                            return (
                              <div key={ntf.id} className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs text-white truncate">{ntf.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                                  {getNotificationStatusLabel(ntf.status)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-400">全部已确认</p>
                      )}
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        最近沟通
                      </p>
                      {recentCommunications.length > 0 ? (
                        <div className="space-y-1.5">
                          {recentCommunications.map((comm) => {
                            const colors = communicationRoleColors[comm.role] || communicationRoleColors.other;
                            return (
                              <div key={comm.id} className="flex items-start gap-1.5">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${colors.text.replace('text-', 'bg-')}`} />
                                <div className="min-w-0">
                                  <p className="text-xs text-white truncate">
                                    <span className="text-slate-400">{comm.contactName}：</span>
                                    {comm.content}
                                  </p>
                                  <p className="text-xs text-slate-600 font-mono">
                                    {getRelativeTime(comm.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">暂无沟通记录</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-5 bg-slate-800/30 rounded-xl border border-slate-700/30">
        <div className="flex items-center gap-3 mb-3">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">最近值班沟通</h3>
        </div>
        {summary.recentComms.length > 0 ? (
          <div className="space-y-2.5">
            {summary.recentComms.map((comm) => {
              const colors = communicationRoleColors[comm.role] || communicationRoleColors.other;
              return (
                <div key={comm.id} className={`p-3 bg-slate-900/50 rounded-xl border ${colors.border}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                      <MessageSquare className={`w-3.5 h-3.5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                          {comm.roleLabel}
                        </span>
                        <span className="text-sm font-medium text-white">{comm.contactName}</span>
                        <span className="text-xs text-slate-500 font-mono ml-auto">
                          {formatDateTimeWithSeconds(comm.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{comm.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">暂无值班沟通记录</p>
        )}
      </div>
    </div>
  );
}
