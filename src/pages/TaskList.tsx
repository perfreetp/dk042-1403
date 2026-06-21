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
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useDispatchStore } from '@/store/useDispatchStore';
import RiskBadge from '@/components/RiskBadge';
import { getRelativeTime } from '@/utils';
import { getDispatchStatusLabel } from '@/data/mockData';
import type { IncidentStatus, DispatchStatus } from '@/types';

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

export default function TaskList() {
  const navigate = useNavigate();
  const { incidents, currentIncident, setCurrentIncident } = useIncidentStore();
  const { setCurrentDispatch, getDispatchByIncident } = useDispatchStore();

  const handleSelectTask = (incidentId: string) => {
    setCurrentIncident(incidentId);
    const dispatch = getDispatchByIncident(incidentId);
    if (dispatch) {
      setCurrentDispatch(dispatch.id);
    }
  };

  const handleGoTracking = (incidentId: string) => {
    handleSelectTask(incidentId);
    navigate('/tracking');
  };

  const handleGoResources = (incidentId: string) => {
    handleSelectTask(incidentId);
    navigate('/resources');
  };

  const activeIncidents = incidents.filter((i) => i.status !== 'completed');
  const completedIncidents = incidents.filter((i) => i.status === 'completed');

  const renderTaskCard = (incident: typeof incidents[0]) => {
    const dispatch = getDispatchByIncident(incident.id);
    const isCurrent = currentIncident?.id === incident.id;
    const StatusIcon = statusConfig[incident.status].icon;

    const confirmedNtf = dispatch?.notifications.filter((n) => n.status === 'confirmed').length || 0;
    const totalNtf = dispatch?.notifications.length || 0;
    const completedNodes = dispatch?.timelineNodes.filter((n) => n.status === 'completed').length || 0;
    const totalNodes = dispatch?.timelineNodes.length || 0;
    const overdueNodes = dispatch?.timelineNodes.filter((n) => n.status === 'overdue').length || 0;

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
              <span className="text-white font-mono text-xs">
                {confirmedNtf}/{totalNtf}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">处置进度</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-xs">
                  {completedNodes}/{totalNodes}
                </span>
                {overdueNodes > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                    {overdueNodes}超时
                  </span>
                )}
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
          <p className="text-xs text-slate-500">
            更新于 {getRelativeTime(incident.updatedAt)}
          </p>
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple-400" />
          </div>
          救援任务列表
        </h2>
        <p className="text-slate-400">查看所有故障任务，快速切换和处置</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {incidents.filter((i) => i.riskLevel === 'red' && i.status !== 'completed').length}
              </p>
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
              <p className="text-2xl font-bold text-white">{activeIncidents.length}</p>
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
              <p className="text-2xl font-bold text-white">{completedIncidents.length}</p>
              <p className="text-xs text-slate-400">已完成任务</p>
            </div>
          </div>
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
            {activeIncidents
              .sort((a, b) => {
                const riskOrder = { red: 0, yellow: 1, green: 2 };
                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
              })
              .map(renderTaskCard)}
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

      {incidents.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">暂无救援任务</h3>
          <p className="text-slate-400 mb-6">从故障接报页面提交新故障后，任务将显示在这里</p>
        </div>
      )}
    </div>
  );
}
