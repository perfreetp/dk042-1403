import { create } from 'zustand';
import type {
  DispatchOrder,
  TimelineNode,
  Resource,
  NotificationTarget,
  NotificationStatus,
  NodeStatus,
} from '@/types';
import {
  mockDispatchOrder,
  buildNotifications,
  buildInitialTimelineNodes,
} from '@/data/mockData';
import { generateId, computeNodeOverdue } from '@/utils';

interface DispatchState {
  dispatchOrders: DispatchOrder[];
  currentDispatchId: string | null;
  createDispatchOrder: (
    incidentId: string,
    resources: Resource[],
    routeValue: string
  ) => DispatchOrder;
  confirmNode: (nodeId: string, remark?: string) => void;
  updateNotificationStatus: (notificationId: string, status: NotificationStatus) => void;
  renotify: (notificationId: string) => void;
  setCurrentDispatch: (dispatchId: string) => void;
  getDispatchByIncident: (incidentId: string) => DispatchOrder | undefined;
  recomputeOverdue: () => void;
  resetDispatch: () => void;
}

function recomputeNodesStatus(nodes: TimelineNode[]): TimelineNode[] {
  const computed = computeNodeOverdue(nodes);
  const firstUncompletedIndex = computed.findIndex((n) => n.status !== 'completed');
  return computed.map((node, index) => {
    if (node.status === 'completed') return node;
    if (index === firstUncompletedIndex) {
      if (node.status === 'overdue') return node;
      return { ...node, status: 'current' as NodeStatus };
    }
    return { ...node, status: node.status === 'overdue' ? 'overdue' : 'pending' as NodeStatus };
  });
}

export const useDispatchStore = create<DispatchState>((set, get) => ({
  dispatchOrders: [mockDispatchOrder],
  currentDispatchId: mockDispatchOrder.id,

  createDispatchOrder: (incidentId, resources, routeValue) => {
    const notifications = buildNotifications(resources, routeValue);
    const initialNodes = recomputeNodesStatus(buildInitialTimelineNodes());
    const now = new Date();

    const newOrder: DispatchOrder = {
      id: generateId('DISP'),
      incidentId,
      selectedResources: resources,
      notifications,
      timelineNodes: initialNodes,
      createdAt: now,
      updatedAt: now,
      status: 'dispatched',
    };

    set((state) => ({
      dispatchOrders: [newOrder, ...state.dispatchOrders],
      currentDispatchId: newOrder.id,
    }));

    return newOrder;
  },

  confirmNode: (nodeId, remark) => {
    const { currentDispatchId } = get();
    if (!currentDispatchId) return;

    set((state) => ({
      dispatchOrders: state.dispatchOrders.map((order) => {
        if (order.id !== currentDispatchId) return order;

        const confirmedNodes = order.timelineNodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              time: new Date(),
              status: 'completed' as NodeStatus,
              remark,
            };
          }
          return node;
        });

        const recomputed = recomputeNodesStatus(confirmedNodes);
        const allCompleted = recomputed.every((n) => n.status === 'completed');

        return {
          ...order,
          timelineNodes: recomputed,
          status: allCompleted ? 'completed' as const : 'in_progress' as const,
          updatedAt: new Date(),
        };
      }),
    }));
  },

  updateNotificationStatus: (notificationId, status) => {
    const { currentDispatchId } = get();
    if (!currentDispatchId) return;

    set((state) => ({
      dispatchOrders: state.dispatchOrders.map((order) => {
        if (order.id !== currentDispatchId) return order;
        return {
          ...order,
          notifications: order.notifications.map((ntf) =>
            ntf.id === notificationId
              ? { ...ntf, status, updatedAt: new Date() }
              : ntf
          ),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  renotify: (notificationId) => {
    const { currentDispatchId } = get();
    if (!currentDispatchId) return;

    set((state) => ({
      dispatchOrders: state.dispatchOrders.map((order) => {
        if (order.id !== currentDispatchId) return order;
        return {
          ...order,
          notifications: order.notifications.map((ntf) =>
            ntf.id === notificationId
              ? { ...ntf, status: 'notified' as NotificationStatus, updatedAt: new Date() }
              : ntf
          ),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  setCurrentDispatch: (dispatchId) => {
    set({ currentDispatchId: dispatchId });
  },

  getDispatchByIncident: (incidentId) => {
    return get().dispatchOrders.find((o) => o.incidentId === incidentId);
  },

  recomputeOverdue: () => {
    set((state) => ({
      dispatchOrders: state.dispatchOrders.map((order) => {
        if (order.status === 'completed') return order;
        const recomputed = recomputeNodesStatus(order.timelineNodes);
        const hasChange = recomputed.some(
          (n, i) => n.status !== order.timelineNodes[i]?.status
        );
        if (!hasChange) return order;
        return { ...order, timelineNodes: recomputed, updatedAt: new Date() };
      }),
    }));
  },

  resetDispatch: () => {
    set({ currentDispatchId: null });
  },
}));

export function useCurrentDispatch(): DispatchOrder | null {
  const { dispatchOrders, currentDispatchId } = useDispatchStore();
  return dispatchOrders.find((o) => o.id === currentDispatchId) || null;
}

export function useDispatchNotifications(): NotificationTarget[] {
  const current = useCurrentDispatch();
  return current?.notifications || [];
}

export function useDispatchTimeline(): TimelineNode[] {
  const current = useCurrentDispatch();
  return current?.timelineNodes || [];
}
