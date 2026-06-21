import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  UserCheck,
  Wrench,
  Truck,
  MapPin,
  Phone,
  Navigation,
  Check,
  Plus,
  X,
  Send,
  ChevronRight,
  AlertCircle,
  Route,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { useResourceStore } from '@/store/useResourceStore';
import { useIncidentStore } from '@/store/useIncidentStore';
import { useDispatchStore, useCurrentDispatch } from '@/store/useDispatchStore';
import NotificationPanel from '@/components/NotificationPanel';
import { getResourceLabel, getDispatchStatusLabel } from '@/data/mockData';
import type { ResourceType, Resource } from '@/types';

const tabs: { key: ResourceType | 'all'; label: string; icon: typeof Bus }[] = [
  { key: 'all', label: '全部', icon: Navigation },
  { key: 'bus', label: '校车', icon: Bus },
  { key: 'supervisor', label: '照管员', icon: UserCheck },
  { key: 'repair', label: '维修', icon: Wrench },
  { key: 'tow', label: '拖车', icon: Truck },
];

const typeIcons: Record<ResourceType, typeof Bus> = {
  bus: Bus,
  supervisor: UserCheck,
  repair: Wrench,
  tow: Truck,
};

export default function ResourceMatch() {
  const navigate = useNavigate();
  const {
    resources,
    selectedResources,
    activeTab,
    setActiveTab,
    selectResource,
    deselectResource,
    isSelected,
    clearSelection,
  } = useResourceStore();
  const { currentIncident } = useIncidentStore();
  const { createDispatchOrder, getDispatchByIncident } = useDispatchStore();
  const currentDispatch = useCurrentDispatch();
  const [showConfirm, setShowConfirm] = useState(false);

  const existingDispatch = currentIncident
    ? getDispatchByIncident(currentIncident.id)
    : undefined;

  const filteredResources =
    activeTab === 'all' ? resources : resources.filter((r) => r.type === activeTab);

  const sortedResources = [...filteredResources].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
    return a.distance - b.distance;
  });

  const hasBus = selectedResources.some((r) => r.type === 'bus');
  const hasRepair = selectedResources.some((r) => r.type === 'repair');
  const hasTow = selectedResources.some((r) => r.type === 'tow');

  const missingRoles: { key: ResourceType; label: string; icon: typeof Bus }[] = [];
  if (!hasBus) missingRoles.push({ key: 'bus', label: '接驳校车', icon: Bus });
  if (!hasRepair) missingRoles.push({ key: 'repair', label: '维修人员', icon: Wrench });
  if (!hasTow) missingRoles.push({ key: 'tow', label: '拖车', icon: Truck });

  const allRolesReady = missingRoles.length === 0;
  const canCreateOrder = selectedResources.length > 0 && currentIncident && allRolesReady;

  const handleCreateDispatch = () => {
    if (!currentIncident || !canCreateOrder) return;
    createDispatchOrder(currentIncident.id, selectedResources, currentIncident.route);
    setShowConfirm(false);
    navigate('/tracking');
  };

  const toggleResource = (resource: Resource) => {
    if (resource.status !== 'available') return;
    if (isSelected(resource.id)) {
      deselectResource(resource.id);
    } else {
      selectResource(resource);
    }
  };

  const getTypeColor = (type: ResourceType) => {
    const colors: Record<ResourceType, string> = {
      bus: 'from-blue-500 to-cyan-500',
      supervisor: 'from-purple-500 to-pink-500',
      repair: 'from-amber-500 to-orange-500',
      tow: 'from-emerald-500 to-teal-500',
    };
    return colors[type];
  };

  const getTypeBgColor = (type: ResourceType) => {
    const colors: Record<ResourceType, string> = {
      bus: 'bg-blue-500/20 text-blue-400',
      supervisor: 'bg-purple-500/20 text-purple-400',
      repair: 'bg-amber-500/20 text-amber-400',
      tow: 'bg-emerald-500/20 text-emerald-400',
    };
    return colors[type];
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Navigation className="w-5 h-5 text-blue-400" />
          </div>
          资源匹配
        </h2>
        <p className="text-slate-400">查看附近可用资源，选择救援方案</p>
      </div>

      {currentIncident && existingDispatch && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-semibold">调度单已生成</p>
                <p className="text-sm text-slate-400">
                  单号 {existingDispatch.id} · 状态：{getDispatchStatusLabel(existingDispatch.status)}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/tracking')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              前往跟踪
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-2">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {sortedResources.map((resource) => {
              const selected = isSelected(resource.id);
              const Icon = typeIcons[resource.type];
              const isBusy = resource.status === 'busy';

              return (
                <div
                  key={resource.id}
                  onClick={() => toggleResource(resource)}
                  className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border p-4 transition-all cursor-pointer ${
                    selected
                      ? 'border-blue-500/50 ring-2 ring-blue-500/20 bg-blue-500/5'
                      : isBusy
                      ? 'border-slate-700/30 opacity-60 cursor-not-allowed'
                      : 'border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(
                        resource.type
                      )} flex items-center justify-center shadow-lg flex-shrink-0 ${
                        isBusy ? 'opacity-50' : ''
                      }`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{resource.name}</h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBgColor(
                                resource.type
                              )}`}
                            >
                              {getResourceLabel(resource.type)}
                            </span>
                          </div>
                          {resource.plateNumber && (
                            <p className="text-sm text-slate-400 font-mono mb-2">
                              {resource.plateNumber}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-bold text-white font-mono">
                              {resource.distance}
                              <span className="text-sm font-normal text-slate-400 ml-1">km</span>
                            </p>
                            <p className="text-xs text-slate-500">距离</p>
                          </div>

                          {selected ? (
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          ) : isBusy ? (
                            <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-lg">
                              忙碌中
                            </span>
                          ) : (
                            <div className="w-8 h-8 rounded-lg border border-slate-600 flex items-center justify-center text-slate-400">
                              <Plus className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <UserCheck className="w-4 h-4" />
                          <span className="truncate">{resource.contact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span className="truncate font-mono">{resource.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{resource.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" />
              已选方案
            </h3>

            {selectedResources.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">尚未选择任何资源</p>
                <p className="text-xs mt-1">从左侧列表中选择救援资源</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedResources.map((resource) => {
                  const Icon = typeIcons[resource.type];
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(
                          resource.type
                        )} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {resource.name}
                        </p>
                        <p className="text-xs text-slate-400">{resource.distance} km</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deselectResource(resource.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {missingRoles.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-300 font-medium">
                          还需补齐以下角色，学校值班老师将自动匹配线路：
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {missingRoles.map((role) => (
                        <button
                          key={role.key}
                          onClick={() => setActiveTab(role.key)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs rounded-lg font-medium transition-colors"
                        >
                          <role.icon className="w-3.5 h-3.5" />
                          补{role.label}
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {allRolesReady && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-emerald-300">
                      接驳校车、维修人员、拖车、学校值班老师已全部配齐
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-700/50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">已选资源</span>
                    <span className="text-white font-medium">{selectedResources.length} 项</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">最近距离</span>
                    <span className="text-emerald-400 font-mono font-medium">
                      {Math.min(...selectedResources.map((r) => r.distance)).toFixed(1)} km
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canCreateOrder}
              className={`w-full mt-5 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                canCreateOrder
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
              生成调度单
              <ChevronRight className="w-5 h-5" />
            </button>

            {selectedResources.length > 0 && (
              <button
                onClick={() => clearSelection()}
                className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                清空选择
              </button>
            )}
          </div>

          {currentDispatch && existingDispatch && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                通知状态
              </h3>
              <NotificationPanel notifications={existingDispatch.notifications} compact />
            </div>
          )}

          {currentIncident && (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
              <h4 className="text-sm font-medium text-white mb-3">当前故障</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">车牌号</span>
                  <span className="text-white font-mono">{currentIncident.plateNumber}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Route className="w-3.5 h-3.5" />
                    线路
                  </span>
                  <span className="text-white text-right text-xs flex-1 ml-4 truncate">
                    {currentIncident.routeLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">位置</span>
                  <span className="text-white text-right text-xs flex-1 ml-4 truncate">
                    {currentIncident.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">学生人数</span>
                  <span className="text-white">{currentIncident.studentCount} 人</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-bold text-white">确认生成调度单</h3>
              <p className="text-sm text-slate-400 mt-1">
                确认后将分别通知接驳司机、维修人员、拖车和学校值班老师
              </p>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-300">将调度以下资源：</p>
              {selectedResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTypeColor(
                      resource.type
                    )} flex items-center justify-center`}
                  >
                    {(() => {
                      const Icon = typeIcons[resource.type];
                      return <Icon className="w-4 h-4 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{resource.name}</p>
                    <p className="text-xs text-slate-400">
                      {resource.contact} · {resource.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-700/50 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateDispatch}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
              >
                确认发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
