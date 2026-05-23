// src/hooks/useEvents.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useMyEventOrders() {
  return useQuery({
    queryKey: ['myEventOrders'],
    queryFn: () => api.get('/events/orders/mine').then(r => r.data),
  });
}

export function useAllEventOrders() {
  return useQuery({
    queryKey: ['adminEventOrders'],
    queryFn: () => api.get('/events/orders/all').then(r => r.data),
    refetchInterval: 15_000,
  });
}

export function useUpdateEventOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, admin_note }) =>
      api.patch(`/events/orders/${orderId}/status`, { status, admin_note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminEventOrders'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
