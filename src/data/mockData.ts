import type { Resource, Incident, TimelineNode, NotificationTarget, DispatchOrder } from '@/types';

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

export const mockSchoolContacts: { route: string; name: string; phone: string }[] = [
  { route: 'route-1', name: '李老师（东校区）', phone: '158****1001' },
  { route: 'route-2', name: '王老师（南校区）', phone: '158****1002' },
  { route: 'route-3', name: '李老师（东校区）', phone: '158****1003' },
  { route: 'route-4', name: '赵老师（西校区）', phone: '158****1004' },
  { route: 'route-5', name: '钱老师（南校区）', phone: '158****1005' },
];

export const mockIncident: Incident = {
  id: 'INC-20240622-001',
  plateNumber: '京B·88888',
  route: 'route-3',
  routeLabel: '3号线（东校区-市区）',
  location: '和平路与建设大街交叉口向东200米',
  studentCount: 38,
  faultType: 'engine',
  isRoadOccupied: true,
  riskLevel: 'red',
  createdAt: new Date(Date.now() - 30 * 60 * 1000),
  updatedAt: new Date(Date.now() - 8 * 60 * 1000),
  status: 'processing',
};

export const mockSecondIncident: Incident = {
  id: 'INC-20240622-002',
  plateNumber: '京B·66666',
  route: 'route-1',
  routeLabel: '1号线（东校区-西校区）',
  location: '解放路高架桥下',
  studentCount: 12,
  faultType: 'tire',
  isRoadOccupied: false,
  riskLevel: 'yellow',
  createdAt: new Date(Date.now() - 12 * 60 * 1000),
  updatedAt: new Date(Date.now() - 12 * 60 * 1000),
  status: 'pending',
};

const mockTimelineNodes: TimelineNode[] = [
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
    expectedMinutes: 5,
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
    expectedMinutes: 25,
  },
  {
    id: 'node-5',
    type: 'towed',
    title: '故障车拖离',
    description: '故障车辆已拖离现场，道路恢复畅通',
    time: null,
    status: 'pending',
    expectedMinutes: 50,
  },
];

export const mockDispatchOrder: DispatchOrder = {
  id: 'DISP-20240622-001',
  incidentId: 'INC-20240622-001',
  selectedResources: [
    mockResources[0],
    mockResources[5],
    mockResources[7],
  ],
  notifications: [
    {
      id: 'ntf-1',
      role: 'driver',
      label: '接驳司机',
      name: '张师傅（京A·12345）',
      phone: '138****1234',
      status: 'confirmed',
      resourceId: 'bus-1',
      updatedAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      id: 'ntf-2',
      role: 'repair',
      label: '维修人员',
      name: '安顺汽修·赵师傅',
      phone: '133****2345',
      status: 'notified',
      resourceId: 'repair-1',
      updatedAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      id: 'ntf-3',
      role: 'tow',
      label: '拖车',
      name: '快捷拖车·周师傅',
      phone: '131****0123',
      status: 'unreachable',
      resourceId: 'tow-1',
      updatedAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      id: 'ntf-4',
      role: 'school',
      label: '学校值班老师',
      name: '李老师（东校区）',
      phone: '158****1003',
      status: 'confirmed',
      updatedAt: new Date(Date.now() - 24 * 60 * 1000),
    },
  ],
  timelineNodes: mockTimelineNodes,
  communications: [
    {
      id: 'comm-1',
      role: 'driver',
      roleLabel: '接驳司机',
      contactName: '张师傅',
      contactPhone: '138****1234',
      content: '已确认收到调度，5分钟内从东校区出发，预计20分钟后到达',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      id: 'comm-2',
      role: 'school',
      roleLabel: '学校值班',
      contactName: '李老师（东校区）',
      contactPhone: '158****1003',
      content: '学校已知情，正在安排老师安抚学生情绪，家长群已通知',
      createdAt: new Date(Date.now() - 22 * 60 * 1000),
    },
    {
      id: 'comm-3',
      role: 'repair',
      roleLabel: '维修点',
      contactName: '赵师傅',
      contactPhone: '133****2345',
      content: '初判发动机故障，需现场诊断，已携带必要工具出发',
      createdAt: new Date(Date.now() - 18 * 60 * 1000),
    },
  ],
  createdAt: new Date(Date.now() - 28 * 60 * 1000),
  updatedAt: new Date(Date.now() - 8 * 60 * 1000),
  status: 'in_progress',
};

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

export function getRouteLabel(routeValue: string): string {
  return routes.find((r) => r.value === routeValue)?.label || '未指定线路';
}

export function getSchoolContact(routeValue: string): { name: string; phone: string } {
  return (
    mockSchoolContacts.find((c) => c.route === routeValue) || {
      name: '学校值班室',
      phone: '158****0000',
    }
  );
}

export function getFaultTypeLabel(value: string): string {
  return faultTypes.find((f) => f.value === value)?.label || value;
}

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

export function getNotificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    notified: '已通知',
    unreachable: '未接通',
    confirmed: '已确认',
  };
  return labels[status] || status;
}

export function getDispatchStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    created: '待派发',
    dispatched: '已派发',
    in_progress: '处置中',
    completed: '已完成',
  };
  return labels[status] || status;
}

export function buildNotifications(
  resources: Resource[],
  routeValue: string
): NotificationTarget[] {
  const targets: NotificationTarget[] = [];
  const now = new Date();

  const bus = resources.find((r) => r.type === 'bus');
  if (bus) {
    targets.push({
      id: `ntf-bus-${bus.id}`,
      role: 'driver',
      label: '接驳司机',
      name: `${bus.contact}（${bus.plateNumber || bus.name}）`,
      phone: bus.phone,
      status: 'notified',
      resourceId: bus.id,
      updatedAt: now,
    });
  }

  const repair = resources.find((r) => r.type === 'repair');
  if (repair) {
    targets.push({
      id: `ntf-repair-${repair.id}`,
      role: 'repair',
      label: '维修人员',
      name: `${repair.name}·${repair.contact}`,
      phone: repair.phone,
      status: 'notified',
      resourceId: repair.id,
      updatedAt: now,
    });
  }

  const tow = resources.find((r) => r.type === 'tow');
  if (tow) {
    targets.push({
      id: `ntf-tow-${tow.id}`,
      role: 'tow',
      label: '拖车',
      name: `${tow.name}·${tow.contact}`,
      phone: tow.phone,
      status: 'notified',
      resourceId: tow.id,
      updatedAt: now,
    });
  }

  const school = getSchoolContact(routeValue);
  targets.push({
    id: 'ntf-school',
    role: 'school',
    label: '学校值班老师',
    name: school.name,
    phone: school.phone,
    status: 'notified',
    updatedAt: now,
  });

  return targets;
}

export function buildInitialTimelineNodes(): TimelineNode[] {
  const now = new Date();
  return [
    {
      id: 'node-1',
      type: 'accepted',
      title: '已接单',
      description: '调度员已接报故障，正在安排救援',
      time: now,
      status: 'completed',
      expectedMinutes: 0,
    },
    {
      id: 'node-2',
      type: 'departed',
      title: '已出发',
      description: '接驳校车、维修人员已从各自位置出发',
      time: null,
      status: 'current',
      expectedMinutes: 5,
    },
    {
      id: 'node-3',
      type: 'arrived',
      title: '到达现场',
      description: '救援车辆和人员已到达故障现场',
      time: null,
      status: 'pending',
      expectedMinutes: 15,
    },
    {
      id: 'node-4',
      type: 'transferred',
      title: '学生转运完成',
      description: '学生已安全转移至接驳车辆',
      time: null,
      status: 'pending',
      expectedMinutes: 25,
    },
    {
      id: 'node-5',
      type: 'towed',
      title: '故障车拖离',
      description: '故障车辆已拖离现场，道路恢复畅通',
      time: null,
      status: 'pending',
      expectedMinutes: 50,
    },
  ];
}
