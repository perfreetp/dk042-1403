import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  Route,
  MapPin,
  Users,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Bell,
  FileText,
  Calendar,
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useDispatchStore } from '@/store/useDispatchStore';
import RiskBadge from '@/components/RiskBadge';
import { getRelativeTime } from '@/utils';
import { getDispatchStatusLabel } from '@/data/mockData';
import type { IncidentStatus, DispatchStatus, RiskLevel } from '@/types';

const statusConfig: Record<IncidentStatus, { label: string; color: string; icon: typeof Circle }> = {
  pending: { label: '待处理', color: 'text-amber-400', icon: Circle },
  processing: { label: '处理中', color: 'text-blue-400', icon: Loader2 },
  completed: { label: '已完成', color: 'text-emerald-400', icon: CheckCircle2 },
};

const dispatchStatusColors: Record<DispatchStatus, string> = {
  created: 'bg-slate-500/20 text-slate-400',
  dispatched: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
};

type FilterKey = 'all' | 'highRisk' | 'overdue' | 'unconfirmed' | 'noDispatch';
type SortKey = 'updatedAt' | 'createdAt' | 'risk';

const filters: { key: FilterKey; label: string; icon: typeof Bell }[] = [
  { key: 'all', label: '全部', icon: ClipboardList },
  { key: 'highRisk', label: '高风险', icon: AlertTriangle },
  { key: 'overdue', label: '超时', icon: Clock },
  { key: 'unconfirmed', label: '未确认通知', icon: Bell },
  { key: 'noDispatch', label: '未派单', icon: FileText },
];

const sorts: { key: SortKey; label: string; icon: typeof Calendar }[] = [
  { key: 'updatedAt', label: '最近更新', icon: Calendar },
  { key: 'createdAt', label: '接报时间', icon: Clock },
  { key: 'risk', label: '风险等级', icon: AlertTriangle },
];

const riskOrder: Record<RiskLevel, number> = { red: 0, yellow: 1, green: 2 };

export default function TaskList() {
  const navigate = useNavigate();
  const { incidents, currentIncident, setCurrentIncident } = useIncidentStore();
  const { setCurrentDispatch, getDispatchByIncident } = useDispatchStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('updatedAt');

  const filteredSorted = useMemo(() => {
    let list = [...incidents];

    if (activeFilter === 'highRisk') {
      list = list.filter((i) => i.riskLevel === 'red');
    } else if (activeFilter === 'overdue') {
      list = list.filter((i) => {
        const d = getDispatchByIncident(i.id);
        return d && d.timelineNodes.some((n) => n.status === 'overdue');
      });
    } else if (activeFilter === 'unconfirmed') {
      list = list.filter((i) => {
        const d = getDispatchByIncident(i.id);
        if (!d) return false;
        return d.notifications.some((n) => n.status !== 'confirmed');
      });
    } else if (activeFilter === 'noDispatch') {
      list = list.filter((i) => !getDispatchByIncident(i.id));
    }

    list.sort((a, b) => {
      if (activeSort === 'risk') {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      if (activeSort === 'createdAt') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return list;
  }, [incidents, activeFilter, activeSort, getDispatchByIncident]);

  const activeIncidents = filteredSorted.filter((i) => i.status !== 'completed');
  const completedIncidents = filteredSorted.filter((i) => i.status === 'completed');

  const stats = useMemo(() => {
    const hasDispatch = (id: string) => !!getDispatchByIncident(id);
    const active = incidents.filter((i) => i.status !== 'completed');
    return {
      red: active.filter((i) => i.riskLevel === 'red').length,
      active: active.length,
      completed: incidents.filter((i) => i.status === 'completed').length,
      overdue: active.filter((i) => {
        const d = getDispatchByIncident(i.id);
        return d && d.timelineNodes.some((n) => n.status === 'overdue');
      }).length,
      noDispatch: active.filter((i) => !hasDispatch(i.id)).length,
      unconfirmed: active.filter((i) => {
        const d = getDispatchByIncident(i.id);
        return d && d.notifications.some((n) => n.status !== 'confirmed');
      }).length,
    };
  }, [incidents, getDispatchByIncident]);

  const handleSelectTask = (incidentId: string) => {
    setCurrentIncident(incidentId);
    const dispatch = getDispatchByIncident(incidentId);
    if (dispatch) setCurrentDispatch(dispatch.id);
  };

  const handleGoTracking = (incidentId: string) => {
    handleSelectTask(incidentId);
    navigate('/tracking');
  };

  const handleGoResources = (incidentId: string) => {
    handleSelectTask(incidentId);
    navigate('/resources');
  };

  const renderTaskCard = (incident: typeof incidents[0]) => {
    const dispatch = getDispatchByIncident(incident.id);
    const isCurrent = currentIncident?.id === incident.id;
    const StatusIcon = statusConfig[incident.status].icon;

    const confirmedNtf = dispatch?.notifications.filter((n) => n.status === 'confirmed').length || 0;
    const totalNtf = dispatch?.notifications.length || 0;
    const completedNodes = dispatch?.timelineNodes.filter((n) => n.status === 'completed').length || 0;
    const totalNodes = dispatch?.timelineNodes.length || 0;
    const overdueNodes = dispatch?.timelineNodes.filter((n) => n.status === 'overdue').length || 0;
    const hasUnconfirmed = totalNtf > 0 && confirmedNtf < totalNtf;

    return (
      <div
        key={incident.id}
        className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border p-5 transition-all ${
          isCurrent
            ? 'border-blue-500/50 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
            : 'border-slate-700/50 hover:border-slate-600 hover:shadow-lg'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                incident.riskLevel === 'red'
                  ? 'bg-red-500/20'
                  : incident.riskLevel === 'yellow'
                  ? 'bg-amber-500/20'
                  : 'bg-emerald-500/20'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  incident.riskLevel === 'red'
                    ? 'text-red-400'
                    : incident.riskLevel === 'yellow'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-semibold text-white truncate">{incident.plateNumber}</h4>
                <RiskBadge level={incident.riskLevel} size="sm" />
                {overdueNodes > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                    {overdueNodes}超时
                  </span>
                )}
                {!dispatch && incident.status !== 'completed' && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                    未派单
                  </span>
                )}
                {hasUnconfirmed && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    {totalNtf - confirmedNtf}未确认
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{incident.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusIcon className={`w-4 h-4 ${statusConfig[incident.status].color} ${incident.status === 'processing' ? 'animate-spin' : ''}`} />
            <span className={`text-xs font-medium ${statusConfig[incident.status].color}`}>
              {statusConfig[incident.status].label}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Route className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="truncate">{incident.routeLabel || '未指定线路'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="truncate">{incident.location}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{incident.studentCount}人</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{getRelativeTime(incident.createdAt)}</span>
            </div>
          </div>
        </div>

        {dispatch && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">调度状态</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dispatchStatusColors[dispatch.status]}`}>
                {getDispatchStatusLabel(dispatch.status)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">通知确认</span>
              <span className="text-white font-mono text-xs">{confirmedNtf}/{totalNtf}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">处置进度</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-xs">{completedNodes}/{totalNodes}</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  overdueNodes > 0
                    ? 'bg-gradient-to-r from-red-500 to-amber-500'
                    : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                }`}
                style={{ width: `${totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            更新于 {getRelativeTime(incident.updatedAt)}
          </div>
          <div className="flex gap-2">
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
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple-400" />
          </div>
          救援任务列表
        </h2>
        <p className="text-slate-400">查看所有故障任务，快速切换和处置</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.red}</p>
              <p className="text-xs text-slate-400">高风险任务</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-slate-400">进行中任务</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-xs text-slate-400">已完成任务</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              <p className="text-xs text-slate-400">超时任务</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.noDispatch + stats.unconfirmed}</p>
              <p className="text-xs text-slate-400">待确认/未派</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-1.5">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                activeFilter === f.key
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40'
                  : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
              {f.key === 'all' && (
                <span className="ml-0.5 text-slate-400">({incidents.length})</span>
              )}
            </button>
          ))}
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="清除筛选"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-1.5">
          <ArrowUpDown className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          {sorts.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSort(s.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                activeSort === s.key
                  ? 'bg-blue-500/25 text-blue-200 border border-blue-500/40'
                  : 'text-slate-300 hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeIncidents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            进行中
            <span className="text-sm font-normal text-slate-400 ml-1">({activeIncidents.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeIncidents.map(renderTaskCard)}
          </div>
        </div>
      )}

      {completedIncidents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            已完成
            <span className="text-sm font-normal text-slate-400 ml-1">({completedIncidents.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            {completedIncidents.map(renderTaskCard)}
          </div>
        </div>
      )}

      {filteredSorted.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">没有匹配的任务</h3>
          <p className="text-slate-400 mb-2">试试切换筛选条件</p>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            查看全部任务
          </button>
        </div>
      )}
    </div>
  );
}
