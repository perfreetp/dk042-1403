import type { RiskAssessment, RiskLevel, TimelineNode, CommunicationRole } from '@/types';

export function calculateRisk(
  studentCount: number,
  isRoadOccupied: boolean,
  faultType: string,
  nearestDistance: number = 5
): RiskAssessment {
  let studentRisk: RiskLevel;
  let studentDesc: string;

  if (studentCount >= 30) {
    studentRisk = 'red';
    studentDesc = `${studentCount}名学生滞留，需立即接驳`;
  } else if (studentCount >= 15) {
    studentRisk = 'yellow';
    studentDesc = `${studentCount}名学生滞留，需尽快安排`;
  } else if (studentCount > 0) {
    studentRisk = 'green';
    studentDesc = `${studentCount}名学生滞留，风险较低`;
  } else {
    studentRisk = 'green';
    studentDesc = '无学生滞留';
  }

  let roadRisk: RiskLevel;
  let roadDesc: string;

  const highRiskFaults = ['brake', 'engine'];
  const mediumRiskFaults = ['tire', 'cooling', 'electrical'];

  if (isRoadOccupied && highRiskFaults.includes(faultType)) {
    roadRisk = 'red';
    roadDesc = '占道停放且故障严重，存在道路安全隐患';
  } else if (isRoadOccupied || highRiskFaults.includes(faultType)) {
    roadRisk = 'yellow';
    roadDesc = isRoadOccupied ? '占道停放，影响交通' : '故障较严重，需专业维修';
  } else if (mediumRiskFaults.includes(faultType)) {
    roadRisk = 'yellow';
    roadDesc = '一般故障，可临时停靠';
  } else {
    roadRisk = 'green';
    roadDesc = '轻微故障，不影响交通';
  }

  let resourceRisk: RiskLevel;
  let resourceDesc: string;

  if (nearestDistance > 6) {
    resourceRisk = 'red';
    resourceDesc = `最近资源${nearestDistance.toFixed(1)}公里，距离较远`;
  } else if (nearestDistance > 3) {
    resourceRisk = 'yellow';
    resourceDesc = `最近资源${nearestDistance.toFixed(1)}公里，距离适中`;
  } else {
    resourceRisk = 'green';
    resourceDesc = `最近资源${nearestDistance.toFixed(1)}公里，距离较近`;
  }

  const riskScores: Record<RiskLevel, number> = {
    red: 3,
    yellow: 2,
    green: 1,
  };

  const totalScore =
    riskScores[studentRisk] * 0.4 +
    riskScores[roadRisk] * 0.35 +
    riskScores[resourceRisk] * 0.25;

  let overall: RiskLevel;
  if (totalScore >= 2.5) {
    overall = 'red';
  } else if (totalScore >= 1.8) {
    overall = 'yellow';
  } else {
    overall = 'green';
  }

  return {
    studentRisk,
    roadRisk,
    resourceRisk,
    overall,
    studentDesc,
    roadDesc,
    resourceDesc,
  };
}

export function formatTime(date: Date | null): string {
  if (!date) return '--:--';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateTime(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

export function formatDateTimeWithSeconds(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export function getDurationMins(from: Date, to: Date = new Date()): number {
  return Math.floor((to.getTime() - from.getTime()) / 60000);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentNode(nodes: TimelineNode[]): TimelineNode | null {
  const firstUncompleted = nodes.find((n) => n.status !== 'completed');
  return firstUncompleted || null;
}

export function getLastCompletedTime(nodes: TimelineNode[]): Date | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].status === 'completed' && nodes[i].time) {
      return nodes[i].time as Date;
    }
  }
  return null;
}

export function computeNodeOverdue(nodes: TimelineNode[]): TimelineNode[] {
  const now = new Date();
  const lastCompletedTime = getLastCompletedTime(nodes) || nodes[0]?.time || now;
  const baseTime = lastCompletedTime || now;

  return nodes.map((node) => {
    if (node.status === 'completed') {
      return node;
    }
    if (node.status === 'current' && node.expectedMinutes) {
      const elapsed = getDurationMins(baseTime, now);
      if (elapsed > node.expectedMinutes) {
        return { ...node, status: 'overdue' as const };
      }
    }
    return node;
  });
}

export function getMostUrgentNodeId(nodes: TimelineNode[]): string | null {
  const overdue = nodes.find((n) => n.status === 'overdue');
  if (overdue) return overdue.id;
  const current = nodes.find((n) => n.status === 'current');
  if (current) return current.id;
  return null;
}

export function getEstimatedArrivalTime(
  nodes: TimelineNode[],
  currentNode: TimelineNode | null
): Date | null {
  if (!currentNode || !currentNode.expectedMinutes) return null;
  const baseTime = getLastCompletedTime(nodes) || new Date();
  return new Date(baseTime.getTime() + currentNode.expectedMinutes * 60000);
}

export function getOverdueMins(node: TimelineNode, nodes: TimelineNode[]): number {
  if (node.status !== 'overdue' || !node.expectedMinutes) return 0;
  const baseTime = getLastCompletedTime(nodes) || new Date();
  return Math.max(0, getDurationMins(baseTime) - node.expectedMinutes);
}

export function formatDuration(mins: number): string {
  if (mins <= 0) return '0分钟';
  if (mins < 60) return `${mins}分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}小时${m}分` : `${h}小时`;
}

export interface DispatchReview {
  nodeDurations: { title: string; duration: number; expected: number; overdue: number; completed: boolean }[];
  totalMinutes: number;
  totalOverdueMinutes: number;
  overdueNodes: number;
  completedNodes: number;
  totalNodes: number;
}

export function computeDispatchReview(nodes: TimelineNode[]): DispatchReview {
  const sorted = [...nodes].sort((a, b) => {
    const order: Record<string, number> = { accepted: 0, departed: 1, arrived: 2, transferred: 3, towed: 4 };
    return order[a.type] - order[b.type];
  });

  const nodeDurations: DispatchReview['nodeDurations'] = [];
  let totalMinutes = 0;
  let totalOverdueMinutes = 0;
  let completedNodes = 0;

  for (let i = 0; i < sorted.length; i++) {
    const node = sorted[i];
    const prev = sorted[i - 1];
    const prevTime = prev?.time || null;
    const nodeTime = node.time || null;
    const duration = prevTime && nodeTime ? getDurationMins(prevTime, nodeTime) : 0;
    const overdue = node.status === 'completed' && prevTime && node.expectedMinutes
      ? Math.max(0, getDurationMins(prevTime, nodeTime) - node.expectedMinutes)
      : 0;
    if (node.status === 'completed') completedNodes++;
    if (duration > 0) totalMinutes += duration;
    if (overdue > 0) totalOverdueMinutes += overdue;

    nodeDurations.push({
      title: node.title,
      duration,
      expected: node.expectedMinutes || 0,
      overdue,
      completed: node.status === 'completed',
    });
  }

  const overdueNodes = nodeDurations.filter((d) => d.overdue > 0).length;

  return {
    nodeDurations,
    totalMinutes,
    totalOverdueMinutes,
    overdueNodes,
    completedNodes,
    totalNodes: sorted.length,
  };
}

export const communicationRoleColors: Record<string, { bg: string; text: string; border: string }> = {
  driver: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  repair: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  tow: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  school: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  dispatch: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
  other: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
};

export const ntfStatusStyles: Record<string, { bg: string; text: string }> = {
  notified: { bg: 'bg-blue-500/15', text: 'text-blue-300' },
  unreachable: { bg: 'bg-red-500/15', text: 'text-red-300' },
  confirmed: { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
};

export const ntfRoleToCommRole: Record<string, CommunicationRole> = {
  driver: 'driver',
  repair: 'repair',
  tow: 'tow',
  supervisor: 'school',
  school: 'school',
};

export function generateReviewSummary(params: {
  plateNumber: string;
  routeLabel: string;
  faultType: string;
  studentCount: number;
  review: DispatchReview;
  createdAt: Date;
  nodeTimes: { title: string; time: Date | null; remark?: string }[];
}): string {
  const { plateNumber, routeLabel, faultType, studentCount, review, createdAt, nodeTimes } = params;
  const lines: string[] = [];

  lines.push('【校车救援复盘摘要】');
  lines.push(`车牌：${plateNumber} | 线路：${routeLabel || '未指定'}`);
  lines.push(`故障：${faultType} | 学生：${studentCount}人`);
  lines.push('---');

  lines.push('时间线：');
  for (let i = 0; i < review.nodeDurations.length; i++) {
    const item = review.nodeDurations[i];
    const nodeTime = nodeTimes[i]?.time;
    const timeStr = nodeTime ? formatTime(nodeTime) : '--:--';
    const expectedStr = item.expected > 0 ? `预计${item.expected}分钟` : '';
    const actualStr = item.completed ? `实际${formatDuration(item.duration)}` : '未完成';
    const overdueStr = item.overdue > 0 ? ` ⚠超时${formatDuration(item.overdue)}` : '';
    const mark = item.overdue > 0 ? '⚠' : item.completed ? '✓' : '…';
    lines.push(`- ${item.title}：${timeStr} → ${actualStr}${expectedStr ? `（${expectedStr}）` : ''}${overdueStr} ${mark}`);
    if (item.overdue > 0 || item.completed) {
      const remark = nodeTimes[i]?.remark;
      if (remark && remark.trim()) {
        lines.push(`  • 原因：${remark.trim()}`);
      } else if (item.overdue > 0) {
        lines.push(`  • 原因：【待补充】`);
      }
    }
  }

  lines.push('---');
  lines.push(`总处置时长：${formatDuration(review.totalMinutes)} | 超时累计：${formatDuration(review.totalOverdueMinutes)} | 超时节点：${review.overdueNodes}个`);
  lines.push(`接报时间：${formatDateTime(createdAt)}`);

  if (review.overdueNodes > 0) {
    const overdueNames = review.nodeDurations
      .filter((d) => d.overdue > 0)
      .map((d, idx) => {
        const remark = nodeTimes[review.nodeDurations.indexOf(d)]?.remark;
        return `${d.title}超${formatDuration(d.overdue)}${remark ? `（${remark}）` : ''}`;
      });
    lines.push(`后续建议：${overdueNames.join('、')}，建议优化该环节资源配置与响应速度`);
  } else {
    lines.push('后续建议：本次各节点均在预计时间内完成，流程顺畅');
  }

  return lines.join('\n');
}
