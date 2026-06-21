import { create } from 'zustand';
import type { Incident, RiskAssessment } from '@/types';
import { calculateRisk, generateId } from '@/utils';
import { mockIncident, mockSecondIncident, getRouteLabel } from '@/data/mockData';

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
  setCurrentIncident: (incidentId: string) => void;
  touchIncident: (incidentId: string) => void;
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
  incidents: [mockIncident, mockSecondIncident],
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

    const now = new Date();
    const newIncident: Incident = {
      id: generateId('INC'),
      plateNumber: formData.plateNumber,
      route: formData.route,
      routeLabel: getRouteLabel(formData.route),
      location: formData.location,
      studentCount: formData.studentCount,
      faultType: formData.faultType,
      isRoadOccupied: formData.isRoadOccupied,
      riskLevel: riskAssessment.overall,
      createdAt: now,
      updatedAt: now,
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

  setCurrentIncident: (incidentId) => {
    const { incidents } = get();
    const incident = incidents.find((i) => i.id === incidentId);
    if (incident) {
      set({ currentIncident: incident });
    }
  },

  touchIncident: (incidentId) => {
    const now = new Date();
    set((state) => {
      const incidents = state.incidents.map((i) =>
        i.id === incidentId ? { ...i, updatedAt: now } : i
      );
      const currentIncident =
        state.currentIncident?.id === incidentId
          ? { ...state.currentIncident, updatedAt: now }
          : state.currentIncident;
      return { incidents, currentIncident };
    });
  },
}));
