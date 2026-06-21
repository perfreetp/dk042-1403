import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  Bell,
  MessageSquare,
  CheckCircle2,
  Circle,
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
  Square,
  CheckSquare,
  Edit3,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useDispatchStore } from '@/store/useDispatchStore';
import RiskBadge from '@/components/RiskBadge';
import { getRelativeTime, formatDateTimeWithSeconds, communicationRoleColors, ntfStatusStyles } from '@/utils';
import { getDispatchStatusLabel, getNotificationStatusLabel } from '@/data/mockData';
import type { Incident, DispatchOrder, NotificationTarget, CommunicationRecord, HandoverRecord } from '@/types';

const ntfRoleIcons: Record<string, typeof Bus> = {
  driver: Bus,
  repair: Wrench,
  tow: Truck,
  supervisor: GraduationCap,
  school: GraduationCap,
};

type GroupKey = 'highRisk' | 'overdue' | 'unconfirmed' | 'noDispatch';

interface HandoverItem {
  incident: Incident;
  dispatch: DispatchOrder | undefined;
  overdueNodeCount: number;
  unconfirmedNotifications: NotificationTarget[];
  recentCommunications: CommunicationRecord[];
  priority: number;
  handover: HandoverRecord;
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

const groupConfig: Record<GroupKey, { label: string; icon: typeof AlertTriangle; color: string; desc: string }> = {
  highRisk: { label: '高风险任务', icon: AlertTriangle, color: 'text-red-400', desc: '风险等级为红色，需优先处理' },
  overdue: { label: '已超时任务', icon: Clock, color: 'text-red-400', desc: '存在节点超时，需加快处置' },
  unconfirmed: { label: '未确认通知', icon: Bell, color: 'text-blue-400', desc: '存在未确认或未接通的通知' },
  noDispatch: { label: '未派单任务', icon: Circle, color: 'text-amber-400', desc: '尚未生成调度单，需先匹配资源' },
};

export default function ShiftHandover() {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();
  const { getDispatchByIncident, setCurrentDispatch, recomputeOverdue, getOrCreateHandover, acknowledgeHandover, updateHandoverNote, resetHandoverAcknowledged } = useDispatchStore();
  const [expandedGroups, setExpandedGroups] = useState<Record<GroupKey, boolean>>({
    highRisk: true,
    overdue: true,
    unconfirmed: true,
    noDispatch: true,
  });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  useEffect(() => {
    recomputeOverdue();
    const timer = setInterval(() => {
      recomputeOverdue();
    }, 30000);
    return () => clearInterval(timer);
  }, [recomputeOverdue]);

  const getGroupForItem = useCallback((item: HandoverItem): GroupKey | null => {
    if (item.incident.riskLevel === 'red') return 'highRisk';
    if (item.overdueNodeCount > 0) return 'overdue';
    if (item.unconfirmedNotifications.length > 0) return 'unconfirmed';
    if (!item.dispatch) return 'noDispatch';
    return null;
  }, []);

  const handoverItems = useMemo(() => {
    const activeIncidents = incidents.filter((i) => i.status !== 'completed');
    const items: HandoverItem[] = activeIncidents.map((incident) => {
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
      const handover = getOrCreateHandover(incident.id);
      const item: HandoverItem = {
        incident,
        dispatch,
        overdueNodeCount,
        unconfirmedNotifications,
        recentCommunications,
        priority: 0,
        handover,
      };
      item.priority = computePriority(item);
      return item;
    });

    const grouped: Record<GroupKey, HandoverItem[]> = {
      highRisk: [],
      overdue: [],
      unconfirmed: [],
      noDispatch: [],
    };

    items.forEach((item) => {
      const group = getGroupForItem(item);
      if (group) grouped[group].push(item);
    });

    (Object.keys(grouped) as GroupKey[]).forEach((key) => {
      grouped[key].sort((a, b) => b.priority - a.priority);
    });

    return { grouped, items };
  }, [incidents, getDispatchByIncident, getOrCreateHandover, getGroupForItem]);

  const summary = useMemo(() => {
    const active = incidents.filter((i) => i.status !== 'completed');
    const allDispatches = active
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

    const acknowledgedCount = handoverItems.items.filter((i) => i.handover.acknowledged).length;

    return {
      activeCount: active.length,
      acknowledgedCount,
      pendingCount: handoverItems.items.length - acknowledgedCount,
      highRiskCount: active.filter((i) => i.riskLevel === 'red').length,
      noDispatchCount: active.filter((i) => !getDispatchByIncident(i.id)).length,
      totalOverdue,
      totalUnconfirmed,
      totalUnreachable,
      recentComms,
    };
  }, [incidents, getDispatchByIncident, handoverItems]);

  const handleGoTracking = (incidentId: string) => {
    useIncidentStore.getState().setCurrentIncident(incidentId);
    const dispatch = getDispatchByIncident(incidentId);
    if (dispatch) setCurrentDispatch(dispatch.id);
    navigate('/tracking');
  };

  const handleGoResources = (incidentId: string) => {
    useIncidentStore.getState().setCurrentIncident(incidentId);
    navigate('/resources');
  };

  const toggleGroup = (group: GroupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const startEditNote = (incidentId: string, currentNote: string) => {
    setEditingNote(incidentId);
    setNoteDraft(currentNote);
  };

  const saveNote = (incidentId: string) => {
    updateHandoverNote(incidentId, noteDraft);
    setEditingNote(null);
    setNoteDraft('');
  };

  const renderTaskCard = (item: HandoverItem) => {
    const { incident, dispatch, overdueNodeCount, unconfirmedNotifications, recentCommunications, handover } = item;
    const completedNodes = dispatch?.timelineNodes.filter((n) => n.status === 'completed').length || 0;
    const totalNodes = dispatch?.timelineNodes.length || 0;
    const confirmedNtf = dispatch?.notifications.filter((n) => n.status === 'confirmed').length || 0;
    const totalNtf = dispatch?.notifications.length || 0;
    const isEditing = editingNote === incident.id;

    return (
      <div
        key={incident.id}
        className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border p-5 transition-all ${
          handover.acknowledged
            ? 'border-emerald-500/30 opacity-75'
            : 'border-slate-700/50 hover:border-slate-600'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              onClick={() => acknowledgeHandover(incident.id)}
              className="mt-1 flex-shrink-0 text-slate-400 hover:text-white transition-colors"
              title={handover.acknowledged ? '取消接班确认' : '接班确认'}
            >
              {handover.acknowledged ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h4 className={`font-semibold ${handover.acknowledged ? 'text-slate-400' : 'text-white'}`}>
                  {incident.plateNumber}
                </h4>
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
                {handover.acknowledged && handover.acknowledgedAt && (
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                    已接班 · {getRelativeTime(handover.acknowledgedAt)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

        <div className="pt-3 border-t border-slate-700/50">
          <div className="flex items-start gap-2">
            {isEditing ? (
              <Edit3 className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
            ) : (
              <MessageSquare className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
            )}
            <div className="flex-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="输入交接备注..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => saveNote(incident.id)}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(null);
                      setNoteDraft('');
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className={`text-sm flex-1 ${handover.handoverNote ? 'text-slate-200' : 'text-slate-500'}`}>
                    {handover.handoverNote || '暂无交接备注，点击右侧按钮添加'}
                  </p>
                  <button
                    onClick={() => startEditNote(incident.id, handover.handoverNote)}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
                    title="编辑交接备注"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
              </div>
              交接班清单
            </h2>
            <p className="text-slate-400">
              按优先级分组展示未完成任务，勾选确认接班情况，填写交接备注
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                recomputeOverdue();
              }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新超时
            </button>
            <button
              onClick={resetHandoverAcknowledged}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5"
              title="清空所有接班确认"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置接班
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.activeCount}</p>
              <p className="text-xs text-slate-400">待交接</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.acknowledgedCount}</p>
              <p className="text-xs text-slate-400">已接班</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Circle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.pendingCount}</p>
              <p className="text-xs text-slate-400">待确认</p>
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
              <p className="text-xs text-slate-400">未确认</p>
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
      </div>

      {handoverItems.items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">当前无待交接任务</h3>
          <p className="text-slate-400">所有救援任务已完成，可安心交接</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(groupConfig) as GroupKey[]).map((groupKey) => {
            const group = groupConfig[groupKey];
            const items = handoverItems.grouped[groupKey];
            if (items.length === 0) return null;
            const GroupIcon = group.icon;
            const expanded = expandedGroups[groupKey];
            const acknowledgedCount = items.filter((i) => i.handover.acknowledged).length;

            return (
              <div key={groupKey} className="bg-slate-800/30 rounded-xl border border-slate-700/30">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      groupKey === 'highRisk' ? 'bg-red-500/20' :
                      groupKey === 'overdue' ? 'bg-red-500/20' :
                      groupKey === 'unconfirmed' ? 'bg-blue-500/20' :
                      'bg-amber-500/20'
                    }`}>
                      <GroupIcon className={`w-5 h-5 ${group.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{group.label}</h3>
                        <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                          {items.length} 项
                        </span>
                        {acknowledgedCount > 0 && acknowledgedCount === items.length && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                            全部已接班
                          </span>
                        )}
                        {acknowledgedCount > 0 && acknowledgedCount < items.length && (
                          <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">
                            {acknowledgedCount}/{items.length} 已接
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{group.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>

                {expanded && (
                  <div className="px-5 pb-5 space-y-3">
                    {items.map(renderTaskCard)}
                  </div>
                )}
              </div>
            );
          })}

          {handoverItems.items.filter((i) => getGroupForItem(i) === null).length > 0 && (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30">
              <button
                onClick={() => setExpandedGroups((p) => ({ ...p, highRisk: !p.highRisk }))}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-600/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">其他进行中任务</h3>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                        {handoverItems.items.filter((i) => getGroupForItem(i) === null).length} 项
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">正常进行中，无特殊提醒</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedGroups.highRisk ? 'rotate-90' : ''}`} />
              </button>
              {expandedGroups.highRisk && (
                <div className="px-5 pb-5 space-y-3">
                  {handoverItems.items
                    .filter((i) => getGroupForItem(i) === null)
                    .map(renderTaskCard)}
                </div>
              )}
            </div>
          )}
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
