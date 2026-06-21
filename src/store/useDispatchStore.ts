import { create } from 'zustand';
import type { DispatchOrder, TimelineNode, Resource } from '@/types';
import { mockTimelineNodes } from '@/data/mockData';
import { generateId } from '@/utils';

interface DispatchState {
  dispatchOrders: DispatchOrder[];
  currentDispatch: DispatchOrder | null;
  timelineNodes: TimelineNode[];
  createDispatchOrder: (incidentId: string, resources: Resource[]) => DispatchOrder;
  confirmNode: (nodeId: string, remark?: string) => void;
  updateNodeStatus: () => void;
  getOverdueNodes: () => TimelineNode[];
  resetDispatch: () => void;
}

export const useDispatchStore = create<DispatchState>((set, get) => ({
  dispatchOrders: [],
  currentDispatch: null,
  timelineNodes: mockTimelineNodes,

  createDispatchOrder: (incidentId, resources) => {
    const newOrder: DispatchOrder = {
      id: generateId('DISP'),
      incidentId,
      selectedResources: resources,
      createdAt: new Date(),
      status: 'created',
    };

    const initialNodes: TimelineNode[] = [
      {
        id: 'node-1',
        type: 'accepted',
        title: '已接单',
        description: '调度员已接报故障，正在安排救援',
        time: new Date(),
        status: 'completed',
        expectedMinutes: 0,
      },
      {
        id: 'node-2',
        type: 'departed',
        title: '已出发',
        description: '接驳校车、维修人员已从各自位置出发',
        time: null,
        status: 'pending',
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

    set((state) => ({
      dispatchOrders: [newOrder, ...state.dispatchOrders],
      currentDispatch: newOrder,
      timelineNodes: initialNodes,
    }));

    return newOrder;
  },

  confirmNode: (nodeId, remark) => {
    set((state) => {
      const updatedNodes = state.timelineNodes.map((node, index) => {
        if (node.id === nodeId) {
          return {
            ...node,
            time: new Date(),
            status: 'completed' as const,
            remark,
          };
        }
        const prevNode = state.timelineNodes[index - 1];
        if (prevNode && prevNode.id === nodeId && node.status === 'pending') {
          return { ...node, status: 'current' as const };
        }
        return node;
      });

      const allCompleted = updatedNodes.every((n) => n.status === 'completed');

      return {
        timelineNodes: updatedNodes,
        currentDispatch: state.currentDispatch
          ? {
              ...state.currentDispatch,
              status: allCompleted ? 'completed' : 'in_progress',
            }
          : null,
      };
    });
  },

  updateNodeStatus: () => {
    const { timelineNodes } = get();
    const now = new Date();

    set({
      timelineNodes: timelineNodes.map((node) => {
        if (node.status === 'pending' && node.expectedMinutes) {
          const firstNode = timelineNodes[0];
          if (firstNode?.time) {
            const elapsed = (now.getTime() - firstNode.time.getTime()) / 60000;
            if (elapsed > node.expectedMinutes * 1.2) {
              return { ...node, status: 'overdue' as const };
            }
          }
        }
        return node;
      }),
    });
  },

  getOverdueNodes: () => {
    return get().timelineNodes.filter((n) => n.status === 'overdue');
  },

  resetDispatch: () => {
    set({
      currentDispatch: null,
      timelineNodes: [],
    });
  },
}));
