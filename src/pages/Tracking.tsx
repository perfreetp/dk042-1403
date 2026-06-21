import { useState, useEffect, useRef, useCallback } from 'react';
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
  Route,
  Navigation,
  Timer,
  ChevronDown,
  Send,
  FileText,
  User,
  Bus,
  Wrench,
  Truck,
  GraduationCap,
  Clock3,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useIncidentStore } from '@/store/useIncidentStore';
import {
  useDispatchStore,
  useCurrentDispatch,
  useDispatchTimeline,
  useDispatchCommunications,
} from '@/store/useDispatchStore';
import Timeline from '@/components/Timeline';
import RiskBadge from '@/components/RiskBadge';
import NotificationPanel from '@/components/NotificationPanel';
import {
  getRelativeTime,
  formatDateTime,
  formatTime,
  getCurrentNode,
  getEstimatedArrivalTime,
  getMostUrgentNodeId,
  formatDateTimeWithSeconds,
  computeDispatchReview,
  formatDuration,
  communicationRoleColors,
  generateReviewSummary,
  ntfRoleToCommRole,
} from '@/utils';
import { getResourceLabel, getDispatchStatusLabel, getFaultTypeLabel } from '@/data/mockData';
import type { CommunicationRole } from '@/types';

const roleOptions: { value: CommunicationRole; label: string; icon: typeof Bus }[] = [
  { value: 'driver', label: '接驳司机', icon: Bus },
  { value: 'repair', label: '维修人员', icon: Wrench },
  { value: 'tow', label: '拖车', icon: Truck },
  { value: 'school', label: '学校值班', icon: GraduationCap },
  { value: 'dispatch', label: '调度内部', icon: User },
  { value: 'other', label: '其他', icon: User },
];

export default function Tracking() {
  const { currentIncident } = useIncidentStore();
  const { confirmNode, recomputeOverdue, addCommunication } = useDispatchStore();
  const currentDispatch = useCurrentDispatch();
  const timelineNodes = useDispatchTimeline();
  const communications = useDispatchCommunications();
  const [remark, setRemark] = useState('');
  const [showRemarkInput, setShowRemarkInput] = useState<string | null>(null);
  const urgentRef = useRef<HTMLDivElement>(null);

  const [commRole, setCommRole] = useState<CommunicationRole>('driver');
  const [commName, setCommName] = useState('');
  const [commPhone, setCommPhone] = useState('');
  const [commContent, setCommContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      recomputeOverdue();
    }, 30000);
    return () => clearInterval(timer);
  }, [recomputeOverdue]);

  useEffect(() => {
    if (communications.length && !commName && currentDispatch) {
      const latest = communications[0];
      setCommName(latest.contactName);
      if (latest.contactPhone) setCommPhone(latest.contactPhone);
    }
  }, [communications.length, commName, currentDispatch, communications]);

  const currentNode = getCurrentNode(timelineNodes);
  const estimatedArrival = getEstimatedArrivalTime(timelineNodes, currentNode);
  const mostUrgentId = getMostUrgentNodeId(timelineNodes);
  const overdueNodes = timelineNodes.filter((n) => n.status === 'overdue');
  const review = computeDispatchReview(timelineNodes);
  const allCompleted = timelineNodes.length > 0 && timelineNodes.every((n) => n.status === 'completed');

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

  const scrollToUrgent = useCallback(() => {
    if (mostUrgentId && urgentRef.current) {
      urgentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [mostUrgentId]);

  const handleAddCommunication = () => {
    if (!commContent.trim()) return;
    const opt = roleOptions.find((r) => r.value === commRole);
    addCommunication({
      role: commRole,
      roleLabel: opt?.label || '其他',
      contactName: commName.trim() || opt?.label || '未记录',
      contactPhone: commPhone.trim() || undefined,
      content: commContent.trim(),
    });
    setCommContent('');
  };

  const handleCopySummary = () => {
    if (!currentIncident || !currentDispatch) return;
    const summary = generateReviewSummary({
      plateNumber: currentIncident.plateNumber,
      routeLabel: currentIncident.routeLabel,
      faultType: getFaultTypeLabel(currentIncident.faultType),
      studentCount: currentIncident.studentCount,
      review,
      createdAt: currentIncident.createdAt,
      nodeTimes: currentDispatch.timelineNodes.map((n) => ({ title: n.title, time: n.time })),
    });
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRecordFromNotification = (role: string, name: string, phone: string) => {
    const commRoleValue = ntfRoleToCommRole[role] || 'other';
    setCommRole(commRoleValue);
    setCommName(name);
    setCommPhone(phone);
    setCommContent('');
    const el = document.getElementById('comm-input-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    <div className="max-w-7xl mx-auto">
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
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-red-500/15 transition-colors" onClick={scrollToUrgent}>
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
            <Bell className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-semibold">超时提醒：{overdueNodes.length} 个节点已超时</p>
            <p className="text-sm text-red-300/80">
              {overdueNodes.map((n) => n.title).join('、')} — 点击直接前往处理
            </p>
          </div>
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
            立即处理
            <ChevronDown className="w-4 h-4 rotate-180" />
          </div>
        </div>
      )}

      {currentNode && !overdueNodes.length && !allCompleted && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Navigation className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-blue-400 font-semibold">当前节点：{currentNode.title}</p>
            <p className="text-sm text-slate-400">
              {currentNode.description}
              {estimatedArrival && (
                <span className="ml-3 text-blue-300">
                  预计 {formatTime(estimatedArrival)} 到达
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-lg">
            <Timer className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-mono">
              {currentNode.expectedMinutes ? `${currentNode.expectedMinutes}分钟` : '--'}
            </span>
          </div>
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
                  {currentIncident.routeLabel && (
                    <span className="ml-3 inline-flex items-center gap-1">
                      <Route className="w-3.5 h-3.5" />
                      {currentIncident.routeLabel}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => recomputeOverdue()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                title="刷新状态"
              >
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

            <div ref={urgentRef}>
              <Timeline
                nodes={timelineNodes}
                onConfirm={handleConfirm}
                showConfirmButton={true}
              />
            </div>

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

          {allCompleted && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">救援复盘</h3>
                  <p className="text-sm text-slate-400">处置已全部完成，以下是本次救援的时间分布</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">总处置时长</p>
                  <p className="text-xl font-bold text-white font-mono">{formatDuration(review.totalMinutes)}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">完成节点</p>
                  <p className="text-xl font-bold text-emerald-400 font-mono">{review.completedNodes}/{review.totalNodes}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">超时节点</p>
                  <p className={`text-xl font-bold font-mono ${review.overdueNodes > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{review.overdueNodes}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">超时累计</p>
                  <p className={`text-xl font-bold font-mono ${review.totalOverdueMinutes > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatDuration(review.totalOverdueMinutes)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {review.nodeDurations.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      item.overdue > 0
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-slate-900/50 border-slate-700/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-emerald-500/20' : 'bg-slate-600/30'}`}>
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Clock3 className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.expected > 0 && (
                          <span className="text-xs text-slate-500 font-mono">
                            预计 {item.expected}分钟
                          </span>
                        )}
                        {item.completed && (
                          <span className="text-xs text-slate-400 font-mono">
                            实际 {formatDuration(item.duration)}
                          </span>
                        )}
                        {item.overdue > 0 && (
                          <span className="text-xs text-red-400 font-mono font-medium">
                            超时 {formatDuration(item.overdue)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">汇报摘要</span>
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        复制摘要
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-xl border border-slate-700/50 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                  {generateReviewSummary({
                    plateNumber: currentIncident.plateNumber,
                    routeLabel: currentIncident.routeLabel,
                    faultType: getFaultTypeLabel(currentIncident.faultType),
                    studentCount: currentIncident.studentCount,
                    review,
                    createdAt: currentIncident.createdAt,
                    nodeTimes: currentDispatch.timelineNodes.map((n) => ({ title: n.title, time: n.time })),
                  })}
                </pre>
              </div>
            </div>
          )}
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

              {currentIncident.routeLabel && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">运营线路</p>
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-blue-400" />
                    <p className="text-sm text-white font-medium">{currentIncident.routeLabel}</p>
                  </div>
                </div>
              )}

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
                  已过去 {getRelativeTime(currentIncident.createdAt)}</p>
              </div>

              {currentDispatch && (
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">调度状态</span>
                    <span className="text-blue-400 font-medium">{getDispatchStatusLabel(currentDispatch.status)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-400">调度单号</span>
                    <span className="text-white font-mono text-xs">{currentDispatch.id}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {currentDispatch && currentDispatch.selectedResources.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                救援资源
              </h3>

              <div className="space-y-3">
                {currentDispatch.selectedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                        {getResourceLabel(resource.type)}</span>
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
            </div>
          )}

          {currentDispatch && currentDispatch.notifications.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                通知状态
              </h3>
              <NotificationPanel notifications={currentDispatch.notifications} compact onRecordCommunication={handleRecordFromNotification} />
            </div>
          )}

          {currentDispatch && (
            <div id="comm-input-section" className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                值班沟通记录
              </h3>

              <div className="mb-4 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCommRole(opt.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        commRole === opt.value
                          ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40'
                          : 'bg-slate-700/60 text-slate-300 border border-transparent hover:bg-slate-700'
                      }`}
                    >
                      <opt.icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commName}
                    onChange={(e) => setCommName(e.target.value)}
                    placeholder="联系人"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 text-xs"
                  />
                  <input
                    type="text"
                    value={commPhone}
                    onChange={(e) => setCommPhone(e.target.value)}
                    placeholder="电话"
                    className="w-28 px-3 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 text-xs font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={commContent}
                      onChange={(e) => setCommContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && commContent.trim()) handleAddCommunication();
                      }}
                      placeholder="记录通话或沟通纪要..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleAddCommunication}
                    disabled={!commContent.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    记录
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {communications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">暂无沟通记录</p>
                ) : (
                  communications.map((comm) => {
                    const colors =
                      communicationRoleColors[comm.role] || communicationRoleColors.other;
                    return (
                      <div
                        key={comm.id}
                        className={`p-3 bg-slate-900/50 rounded-xl border ${colors.border}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                            <MessageSquare className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                                  {comm.roleLabel}
                                </span>
                                <span className="text-sm font-medium text-white">
                                  {comm.contactName}
                                </span>
                                {comm.contactPhone && (
                                  <span className="text-xs text-slate-400 font-mono">
                                    {comm.contactPhone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">
                              {formatDateTimeWithSeconds(comm.createdAt)}
                            </p>
                            <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                              {comm.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-medium">值班提示：</span>
              请密切关注各节点超时情况，及时与相关人员确认进度，确保学生安全转运。点击顶部超时提醒可直接定位到最紧急节点。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
