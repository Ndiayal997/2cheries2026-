// src/hooks/useAdmin.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 20_000,
  });
}

export function useAdminClients() {
  return useQuery({
    queryKey: ['adminClients'],
    queryFn: () => api.get('/admin/clients').then(r => r.data),
  });
}

export function useToggleClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/admin/clients/${id}/toggle`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminClients'] }),
  });
}
