import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './AdminDashboardPage.css';

const STATUS_LABELS = {
  pending_wave: 'Attente Wave',
  wave_sent:    'Wave Envoyé',
  confirmed:    'Confirmé',
  cancelled:    'Annulé',
};
const STATUS_BADGE = {
  pending_wave: 'badge-pending',
  wave_sent:    'badge-wave',
  confirmed:    'badge-confirmed',
  cancelled:    'badge-cancelled',
};

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'orders';
  const setTab = (t) => setSearchParams({ tab: t });

  // ── Queries ────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 20000,
  });

  const { data: weekOrders = [], isLoading: lWeek } = useQuery({
    queryKey: ['adminWeekOrders'],
    queryFn: () => api.get('/weeks/orders/all').then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: eventOrders = [], isLoading: lEvent } = useQuery({
    queryKey: ['adminEventOrders'],
    queryFn: () => api.get('/events/orders/all').then(r => r.data),
    refetchInterval: 15000,
  });

  const { data: clients = [], isLoading: lClients } = useQuery({
    queryKey: ['adminClients'],
    queryFn: () => api.get('/admin/clients').then(r => r.data),
  });

  // ── Mutations ──────────────────────────────────────────
  const updateWeekStatus = useMutation({
    mutationFn: ({ orderId, status, admin_note }) =>
      api.patch('/weeks/orders/' + orderId + '/status', { status, admin_note }),
    onSuccess: () => {
      qc.invalidateQueries(['adminWeekOrders']);
      qc.invalidateQueries(['adminStats']);
      qc.invalidateQueries(['weeks']);
      toast.success('Statut mis à jour');
    },
    onError: (err) => toast.error(err.error || 'Erreur'),
  });

  const updateEventStatus = useMutation({
    mutationFn: ({ orderId, status, admin_note }) =>
      api.patch('/events/orders/' + orderId + '/status', { status, admin_note }),
    onSuccess: () => {
      qc.invalidateQueries(['adminEventOrders']);
      qc.invalidateQueries(['adminStats']);
      qc.invalidateQueries(['events']);
      toast.success('Statut mis à jour');
    },
    onError: (err) => toast.error(err.error || 'Erreur'),
  });

  const toggleClient = useMutation({
    mutationFn: (id) => api.patch('/admin/clients/' + id + '/toggle'),
    onSuccess: () => { qc.invalidateQueries(['adminClients']); toast.success('Client mis à jour'); },
    onError: (err) => toast.error(err.error || 'Erreur'),
  });

  const handleLogout = () => { logout(); navigate('/'); };

  const confirmOrder = (type, id) => {
    const fn = type === 'week' ? updateWeekStatus : updateEventStatus;
    fn.mutate({ orderId: id, status: 'confirmed' });
  };
  const cancelOrder = (type, id) => {
    if (!window.confirm('Annuler cette commande ?')) return;
    const fn = type === 'week' ? updateWeekStatus : updateEventStatus;
    fn.mutate({ orderId: id, status: 'cancelled' });
  };
  const markWaveSent = (type, id) => {
    const fn = type === 'week' ? updateWeekStatus : updateEventStatus;
    fn.mutate({ orderId: id, status: 'wave_sent' });
  };

  const tabs = [
    { id: 'orders', label: 'Commandes (' + weekOrders.length + ')' },
    { id: 'events', label: 'Événements (' + eventOrders.length + ')' },
    { id: 'clients', label: 'Clients (' + clients.length + ')' },
  ];

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          2<em style={{ fontStyle: 'italic', color: 'var(--bordeaux-pale)' }}>C</em>
        </div>
        <div className="admin-sidebar-label">Admin</div>
        <nav className="admin-sidebar-nav">
          {tabs.map(t => (
            <button key={t.id} className={'admin-sidebar-btn ' + (tab === t.id ? 'active' : '')}
              onClick={() => setTab(t.id)}>
              {t.id === 'orders' ? '📅' : t.id === 'events' ? '🌟' : '👥'}
              <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>{t.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-logout-btn" onClick={handleLogout}>⬅ Déconnexion</button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Stats */}
        {stats && (
          <div className="admin-stats-grid">
            {[
              { label: 'Clients inscrits', value: stats.clients, icon: '👥' },
              { label: 'Commandes semaines', value: stats.week_orders.total, icon: '📅' },
              { label: 'Commandes événements', value: stats.event_orders.total, icon: '🌟' },
              { label: 'Confirmées', value: stats.week_orders.confirmed + stats.event_orders.confirmed, icon: '✅' },
              { label: 'En attente Wave', value: stats.week_orders.pending_wave + stats.event_orders.pending_wave, icon: '⏳' },
              { label: 'CA (k)', value: Math.round(stats.revenue.total / 1000) + 'k', icon: '💰' },
            ].map(st => (
              <div key={st.label} className="admin-stat-card">
                <div className="admin-stat-icon">{st.icon}</div>
                <div className="admin-stat-value">{st.value}</div>
                <div className="admin-stat-label">{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab header */}
        <div className="admin-tab-bar">
          {tabs.map(t => (
            <button key={t.id}
              className={'admin-tab-btn ' + (tab === t.id ? 'active' : '')}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Panel: Week orders ── */}
        {tab === 'orders' && (
          <div className="admin-panel">
            <div className="admin-panel-title">Commandes — Semaines régulières</div>
            {lWeek ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div> :
            weekOrders.length === 0 ? <p className="admin-empty">Aucune commande.</p> :
            <div className="data-table-container">
              <table className="data-table" style={{ minWidth: 780 }}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Semaine</th>
                    <th>Commande</th>
                    <th>Montant</th>
                    <th>Wave</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weekOrders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.client_name}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{o.client_phone}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{o.week_label}</td>
                      <td style={{ fontSize: '0.78rem', maxWidth: 180 }}>{o.description}</td>
                      <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {Number(o.amount).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--bordeaux)', fontWeight: 600 }}>
                        {Number(o.wave_amount).toLocaleString('fr-FR')}
                      </td>
                      <td>
                        <span className={'badge ' + (STATUS_BADGE[o.status] || 'badge-pending')}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {o.status === 'pending_wave' && (
                            <button className="btn-sm" style={{ background: '#dbeafe', color: '#1e40af' }}
                              onClick={() => markWaveSent('week', o.id)}>✓</button>
                          )}
                          {o.status !== 'confirmed' && o.status !== 'cancelled' && (
                            <button className="btn-sm btn-confirm" onClick={() => confirmOrder('week', o.id)}>Ok</button>
                          )}
                          {o.status !== 'cancelled' && (
                            <button className="btn-sm btn-cancel" onClick={() => cancelOrder('week', o.id)}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </div>
        )}

        {/* ── Panel: Event orders ── */}
        {tab === 'events' && (
          <div className="admin-panel">
            <div className="admin-panel-title">Commandes — Événements</div>
            {lEvent ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div> :
            eventOrders.length === 0 ? <p className="admin-empty">Aucune commande.</p> :
            <div className="data-table-container">
              <table className="data-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Événement</th>
                    <th>Tenue</th>
                    <th>Montant</th>
                    <th>Wave</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventOrders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.client_name}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{o.client_phone}</span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.82rem' }}>{o.event_name}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{o.event_date}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem', maxWidth: 180 }}>{o.description}</td>
                      <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {Number(o.amount).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--bordeaux)', fontWeight: 600 }}>
                        {Number(o.wave_amount).toLocaleString('fr-FR')}
                      </td>
                      <td>
                        <span className={'badge ' + (STATUS_BADGE[o.status] || 'badge-pending')}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {o.status === 'pending_wave' && (
                            <button className="btn-sm" style={{ background: '#dbeafe', color: '#1e40af' }}
                              onClick={() => markWaveSent('event', o.id)}>✓</button>
                          )}
                          {o.status !== 'confirmed' && o.status !== 'cancelled' && (
                            <button className="btn-sm btn-confirm" onClick={() => confirmOrder('event', o.id)}>Ok</button>
                          )}
                          {o.status !== 'cancelled' && (
                            <button className="btn-sm btn-cancel" onClick={() => cancelOrder('event', o.id)}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </div>
        )}

        {/* ── Panel: Clients ── */}
        {tab === 'clients' && (
          <div className="admin-panel">
            <div className="admin-panel-title">Clients inscrits</div>
            {lClients ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div> :
            clients.length === 0 ? <p className="admin-empty">Aucun client.</p> :
            <div className="data-table-container">
              <table className="data-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Inscrit le</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td style={{ fontSize: '0.78rem' }}>{c.email}</td>
                      <td style={{ fontSize: '0.78rem' }}>{c.phone}</td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <span className={'badge ' + (c.is_active ? 'badge-confirmed' : 'badge-cancelled')}>
                          {c.is_active ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={'btn-sm ' + (c.is_active ? 'btn-cancel' : 'btn-confirm')}
                          onClick={() => toggleClient.mutate(c.id)}
                        >
                          {c.is_active ? 'Off' : 'On'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
          </div>
        )}
      </main>
    </div>
  );
}
