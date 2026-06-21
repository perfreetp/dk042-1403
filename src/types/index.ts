export type RiskLevel = 'red' | 'yellow' | 'green';

export type ResourceType = 'bus' | 'supervisor' | 'repair' | 'tow';

export type IncidentStatus = 'pending' | 'processing' | 'completed';

export type DispatchStatus = 'created' | 'dispatched' | 'in_progress' | 'completed';

export type NodeType = 'accepted' | 'departed' | 'arrived' | 'transferred' | 'towed';

export type NodeStatus = 'pending' | 'completed' | 'overdue' | 'current';

export interface Incident {
  id: string;
  plateNumber: string;
  route: string;
  location: string;
  studentCount: number;
  faultType: string;
  isRoadOccupied: boolean;
  riskLevel: RiskLevel;
  createdAt: Date;
  status: IncidentStatus;
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  contact: string;
  phone: string;
  distance: number;
  status: 'available' | 'busy';
  location?: string;
  plateNumber?: string;
}

export interface DispatchOrder {
  id: string;
  incidentId: string;
  selectedResources: Resource[];
  createdAt: Date;
  status: DispatchStatus;
}

export interface TimelineNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  time: Date | null;
  status: NodeStatus;
  remark?: string;
  expectedMinutes?: number;
}

export interface RiskAssessment {
  studentRisk: RiskLevel;
  roadRisk: RiskLevel;
  resourceRisk: RiskLevel;
  overall: RiskLevel;
  studentDesc: string;
  roadDesc: string;
  resourceDesc: string;
}
