import type { Resource, Incident, TimelineNode } from '@/types';

export const mockResources: Resource[] = [
  {
    id: 'bus-1',
    type: 'bus',
    name: '备用校车01',
    plateNumber: '京A·12345',
    contact: '张师傅',
    phone: '138****1234',
    distance: 2.3,
    status: 'available',
    location: '东校区停车场',
  },
  {
    id: 'bus-2',
    type: 'bus',
    name: '备用校车02',
    plateNumber: '京A·67890',
    contact: '李师傅',
    phone: '139****5678',
    distance: 4.8,
    status: 'available',
    location: '西校区停车场',
  },
  {
    id: 'bus-3',
    type: 'bus',
    name: '备用校车03',
    plateNumber: '京A·11111',
    contact: '王师傅',
    phone: '137****9012',
    distance: 7.5,
    status: 'busy',
    location: '执行任务中',
  },
  {
    id: 'supervisor-1',
    type: 'supervisor',
    name: '刘照管员',
    contact: '刘芳',
    phone: '136****3456',
    distance: 1.2,
    status: 'available',
    location: '东校区办公室',
  },
  {
    id: 'supervisor-2',
    type: 'supervisor',
    name: '陈照管员',
    contact: '陈静',
    phone: '135****7890',
    distance: 3.5,
    status: 'available',
    location: '南校区办公室',
  },
  {
    id: 'repair-1',
    type: 'repair',
    name: '安顺汽修',
    contact: '赵师傅',
    phone: '133****2345',
    distance: 3.2,
    status: 'available',
    location: '和平路维修点',
  },
  {
    id: 'repair-2',
    type: 'repair',
    name: '恒通汽修',
    contact: '孙师傅',
    phone: '132****6789',
    distance: 5.6,
    status: 'available',
    location: '建设大街维修点',
  },
  {
    id: 'tow-1',
    type: 'tow',
    name: '快捷拖车',
    contact: '周师傅',
    phone: '131****0123',
    distance: 4.1,
    status: 'available',
    location: '拖车服务中心',
  },
  {
    id: 'tow-2',
    type: 'tow',
    name: '安捷拖车',
    contact: '吴师傅',
    phone: '130****4567',
    distance: 8.3,
    status: 'available',
    location: '北拖车服务站',
  },
];

export const mockIncident: Incident = {
  id: 'INC-20240622-001',
  plateNumber: '京B·88888',
  route: '3号线（东校区-市区）',
  location: '和平路与建设大街交叉口向东200米',
  studentCount: 38,
  faultType: 'engine',
  isRoadOccupied: true,
  riskLevel: 'red',
  createdAt: new Date(Date.now() - 30 * 60 * 1000),
  status: 'processing',
};

export const mockTimelineNodes: TimelineNode[] = [
  {
    id: 'node-1',
    type: 'accepted',
    title: '已接单',
    description: '调度员已接报故障，正在安排救援',
    time: new Date(Date.now() - 30 * 60 * 1000),
    status: 'completed',
    expectedMinutes: 0,
  },
  {
    id: 'node-2',
    type: 'departed',
    title: '已出发',
    description: '接驳校车、维修人员已从各自位置出发',
    time: new Date(Date.now() - 20 * 60 * 1000),
    status: 'completed',
    expectedMinutes: 10,
  },
  {
    id: 'node-3',
    type: 'arrived',
    title: '到达现场',
    description: '救援车辆和人员已到达故障现场',
    time: null,
    status: 'current',
    expectedMinutes: 15,
  },
  {
    id: 'node-4',
    type: 'transferred',
    title: '学生转运完成',
    description: '学生已安全转移至接驳车辆',
    time: null,
    status: 'pending',
    expectedMinutes: 20,
  },
  {
    id: 'node-5',
    type: 'towed',
    title: '故障车拖离',
    description: '故障车辆已拖离现场，道路恢复畅通',
    time: null,
    status: 'pending',
    expectedMinutes: 45,
  },
];

export const faultTypes = [
  { value: 'engine', label: '发动机故障' },
  { value: 'tire', label: '轮胎爆胎' },
  { value: 'brake', label: '刹车系统故障' },
  { value: 'electrical', label: '电气系统故障' },
  { value: 'cooling', label: '冷却系统故障' },
  { value: 'other', label: '其他故障' },
];

export const routes = [
  { value: 'route-1', label: '1号线（东校区-西校区）' },
  { value: 'route-2', label: '2号线（南校区-北校区）' },
  { value: 'route-3', label: '3号线（东校区-市区）' },
  { value: 'route-4', label: '4号线（西校区-市区）' },
  { value: 'route-5', label: '5号线（南校区-开发区）' },
];

export function getResourceLabel(type: string): string {
  const labels: Record<string, string> = {
    bus: '校车',
    supervisor: '照管员',
    repair: '维修点',
    tow: '拖车',
  };
  return labels[type] || type;
}

export function getRiskLabel(level: string): string {
  const labels: Record<string, string> = {
    red: '高风险',
    yellow: '中风险',
    green: '低风险',
  };
  return labels[level] || level;
}
