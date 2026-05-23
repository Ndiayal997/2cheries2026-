// src/hooks/useWeeks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export function useWeeks() {
  return useQuery({
    queryKey: ['weeks'],
    queryFn: () => api.get('/weeks').then(r => r.data),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useMyWeekOrders() {
  return useQuery({
    queryKey: ['myWeekOrders'],
    queryFn: () => api.get('/weeks/orders/mine').then(r => r.data),
  });
}

export function useAllWeekOrders() {
  return useQuery({
    queryKey: ['adminWeekOrders'],
    queryFn: () => api.get('/weeks/orders/all').then(r => r.data),
    refetchInterval: 15_000,
  });
}

export function useUpdateWeekOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, admin_note }) =>
      api.patch(`/weeks/orders/${orderId}/status`, { status, admin_note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminWeekOrders'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      qc.invalidateQueries({ queryKey: ['weeks'] });
    },
  });
}
