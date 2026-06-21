export type RiskLevel = 'red' | 'yellow' | 'green';

export type ResourceType = 'bus' | 'supervisor' | 'repair' | 'tow';

export type IncidentStatus = 'pending' | 'processing' | 'completed';

export type DispatchStatus = 'created' | 'dispatched' | 'in_progress' | 'completed';

export type NodeType = 'accepted' | 'departed' | 'arrived' | 'transferred' | 'towed';

export type NodeStatus = 'pending' | 'completed' | 'overdue' | 'current';

export type NotificationRole = 'driver' | 'repair' | 'tow' | 'supervisor' | 'school';

export type NotificationStatus = 'notified' | 'unreachable' | 'confirmed';

export type CommunicationRole = 'driver' | 'repair' | 'tow' | 'school' | 'dispatch' | 'other';

export interface CommunicationRecord {
  id: string;
  role: CommunicationRole;
  roleLabel: string;
  contactName: string;
  contactPhone?: string;
  content: string;
  createdAt: Date;
}

export interface Incident {
  id: string;
  plateNumber: string;
  route: string;
  routeLabel: string;
  location: string;
  studentCount: number;
  faultType: string;
  isRoadOccupied: boolean;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
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

export interface NotificationTarget {
  id: string;
  role: NotificationRole;
  label: string;
  name: string;
  phone: string;
  status: NotificationStatus;
  resourceId?: string;
  updatedAt: Date;
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

export interface DispatchOrder {
  id: string;
  incidentId: string;
  selectedResources: Resource[];
  notifications: NotificationTarget[];
  timelineNodes: TimelineNode[];
  communications: CommunicationRecord[];
  createdAt: Date;
  updatedAt: Date;
  status: DispatchStatus;
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

export interface HandoverRecord {
  id: string;
  incidentId: string;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  handoverNote: string;
  createdAt: Date;
  updatedAt: Date;
}
