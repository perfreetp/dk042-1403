import type { RiskAssessment, RiskLevel } from '@/types';

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

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
