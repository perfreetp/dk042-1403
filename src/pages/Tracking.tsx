import { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Users,
  Car,
  AlertTriangle,
  Bell,
  Phone,
  CheckCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useDispatchStore } from '@/store/useDispatchStore';
import { useResourceStore } from '@/store/useResourceStore';
import Timeline from '@/components/Timeline';
import RiskBadge from '@/components/RiskBadge';
import { getRelativeTime, formatDateTime } from '@/utils';
import { faultTypes, getResourceLabel } from '@/data/mockData';

export default function Tracking() {
  const { currentIncident } = useIncidentStore();
  const { timelineNodes, confirmNode, updateNodeStatus, getOverdueNodes } = useDispatchStore();
  const { selectedResources } = useResourceStore();
  const [remark, setRemark] = useState('');
  const [showRemarkInput, setShowRemarkInput] = useState<string | null>(null);

  const overdueNodes = getOverdueNodes();

  useEffect(() => {
    const timer = setInterval(() => {
      updateNodeStatus();
    }, 60000);
    return () => clearInterval(timer);
  }, [updateNodeStatus]);

  const handleConfirm = (nodeId: string) => {
    if (showRemarkInput === nodeId && remark.trim()) {
      confirmNode(nodeId, remark);
      setRemark('');
      setShowRemarkInput(null);
    } else {
      setShowRemarkInput(nodeId);
    }
  };

  const handleConfirmWithRemark = (nodeId: string) => {
    confirmNode(nodeId, remark || undefined);
    setRemark('');
    setShowRemarkInput(null);
  };

  const getFaultTypeLabel = (value: string) => {
    return faultTypes.find((f) => f.value === value)?.label || value;
  };

  const completedCount = timelineNodes.filter((n) => n.status === 'completed').length;
  const totalCount = timelineNodes.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!currentIncident) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">暂无进行中的调度</h3>
          <p className="text-slate-400 mb-6">请先从故障接报开始创建新的救援任务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          处置跟踪
        </h2>
        <p className="text-slate-400">实时跟踪救援处置进度</p>
      </div>

      {overdueNodes.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
            <Bell className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-semibold">超时提醒</p>
            <p className="text-sm text-red-300/80">
              有 {overdueNodes.length} 个节点已超时未反馈，请尽快确认
            </p>
          </div>
          <button className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-sm rounded-lg font-medium transition-colors">
            立即确认
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">救援进度</h3>
                  <RiskBadge level={currentIncident.riskLevel} size="sm" pulse={currentIncident.riskLevel === 'red'} />
                </div>
                <p className="text-sm text-slate-400">
                  故障单号：{currentIncident.id}
                </p>
              </div>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">整体进度</span>
                <span className="text-white font-medium">{completedCount}/{totalCount} 节点</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Timeline
              nodes={timelineNodes}
              onConfirm={handleConfirm}
              showConfirmButton={true}
            />

            {showRemarkInput && (
              <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-600/50">
                <p className="text-sm text-slate-300 mb-3">添加备注（可选）</p>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="输入备注信息..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-sm"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => handleConfirmWithRemark(showRemarkInput)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => {
                      setShowRemarkInput(null);
                      setRemark('');
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              故障信息
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">车牌号</p>
                <p className="text-white font-mono font-semibold text-lg">
                  {currentIncident.plateNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">当前位置</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white">{currentIncident.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">学生人数</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <p className="text-white font-semibold">{currentIncident.studentCount} 人</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">是否占道</p>
                  <div className="flex items-center gap-2">
                    {currentIncident.isRoadOccupied ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <p className="text-red-400 font-medium">是</p>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <p className="text-emerald-400 font-medium">否</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">故障类型</p>
                <p className="text-sm text-white">{getFaultTypeLabel(currentIncident.faultType)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">接报时间</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-white">{formatDateTime(currentIncident.createdAt)}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  已过去 {getRelativeTime(currentIncident.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              救援资源
            </h3>

            {selectedResources.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">暂无调度资源</p>
            ) : (
              <div className="space-y-3">
                {selectedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                        {getResourceLabel(resource.type)}
                      </span>
                      <span className="text-xs text-emerald-400 font-medium">
                        {resource.distance} km
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white mb-1">{resource.name}</p>
                    <p className="text-xs text-slate-400">
                      {resource.contact} · {resource.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-medium">值班提示：</span>
              请密切关注各节点超时情况，及时与相关人员确认进度，确保学生安全转运。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
