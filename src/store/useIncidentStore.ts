import { create } from 'zustand';
import type { Incident, RiskAssessment } from '@/types';
import { calculateRisk, generateId } from '@/utils';
import { mockIncident } from '@/data/mockData';

interface IncidentState {
  currentIncident: Incident | null;
  incidents: Incident[];
  formData: {
    plateNumber: string;
    route: string;
    location: string;
    studentCount: number;
    faultType: string;
    isRoadOccupied: boolean;
  };
  riskAssessment: RiskAssessment | null;
  setFormData: (data: Partial<IncidentState['formData']>) => void;
  calculateRisk: (nearestDistance?: number) => void;
  submitIncident: () => Incident | null;
  resetForm: () => void;
  setCurrentIncident: (incident: Incident) => void;
}

const initialFormData = {
  plateNumber: '',
  route: '',
  location: '',
  studentCount: 0,
  faultType: '',
  isRoadOccupied: false,
};

export const useIncidentStore = create<IncidentState>((set, get) => ({
  currentIncident: mockIncident,
  incidents: [mockIncident],
  formData: initialFormData,
  riskAssessment: null,

  setFormData: (data) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
  },

  calculateRisk: (nearestDistance = 5) => {
    const { formData } = get();
    if (!formData.plateNumber && !formData.location) {
      set({ riskAssessment: null });
      return;
    }
    const assessment = calculateRisk(
      formData.studentCount,
      formData.isRoadOccupied,
      formData.faultType,
      nearestDistance
    );
    set({ riskAssessment: assessment });
  },

  submitIncident: () => {
    const { formData, riskAssessment } = get();
    if (!formData.plateNumber || !formData.location || !riskAssessment) {
      return null;
    }

    const newIncident: Incident = {
      id: generateId('INC'),
      plateNumber: formData.plateNumber,
      route: formData.route,
      location: formData.location,
      studentCount: formData.studentCount,
      faultType: formData.faultType,
      isRoadOccupied: formData.isRoadOccupied,
      riskLevel: riskAssessment.overall,
      createdAt: new Date(),
      status: 'pending',
    };

    set((state) => ({
      incidents: [newIncident, ...state.incidents],
      currentIncident: newIncident,
      formData: initialFormData,
      riskAssessment: null,
    }));

    return newIncident;
  },

  resetForm: () => {
    set({
      formData: initialFormData,
      riskAssessment: null,
    });
  },

  setCurrentIncident: (incident) => {
    set({ currentIncident: incident });
  },
}));
