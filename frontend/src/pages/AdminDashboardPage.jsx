// src/pages/AdminDashboardPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
  const [tab, setTab] = useState('orders');
  const [noteModal, setNoteModal] = useState(null); // {orderId, type, note}

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
      api.patch(`/weeks/orders/${orderId}/status`, { status, admin_note }),
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
      api.patch(`/events/orders/${orderId}/status`, { status, admin_note }),
    onSuccess: () => {
      qc.invalidateQueries(['adminEventOrders']);
      qc.invalidateQueries(['adminStats']);
      qc.invalidateQueries(['events']);
      toast.success('Statut mis à jour');
    },
    onError: (err) => toast.error(err.error || 'Erreur'),
  });

  const toggleClient = useMutation({
    mutationFn: (id) => api.patch(`/admin/clients/${id}/toggle`),
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
    { id: 'orders', label: `Commandes semaines (${weekOrders.length})` },
    { id: 'events', label: `Événements (${eventOrders.length})` },
    { id: 'clients', label: `Clients (${clients.length})` },
  ];

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          2<em style={{ fontStyle: 'italic', color: 'var(--bordeaux-pale)' }}>C</em>
        </div>
        <div style={s.sidebarLabel}>Admin</div>
        <nav style={s.sidebarNav}>
          {tabs.map(t => (
            <button key={t.id} style={{ ...s.sidebarBtn, ...(tab === t.id ? s.sidebarBtnActive : {}) }}
              onClick={() => setTab(t.id)}>
              {t.id === 'orders' ? '📅' : t.id === 'events' ? '🌟' : '👥'}
              <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem' }}>{t.label}</span>
            </button>
          ))}
        </nav>
        <button style={s.logoutSidebar} onClick={handleLogout}>⬅ Déconnexion</button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Stats */}
        {stats && (
          <div style={s.statsGrid}>
            {[
              { label: 'Clients inscrits', value: stats.clients, icon: '👥' },
              { label: 'Commandes semaines', value: stats.week_orders.total, icon: '📅' },
              { label: 'Commandes événements', value: stats.event_orders.total, icon: '🌟' },
              { label: 'Confirmées', value: stats.week_orders.confirmed + stats.event_orders.confirmed, icon: '✅' },
              { label: 'En attente Wave', value: stats.week_orders.pending_wave + stats.event_orders.pending_wave, icon: '⏳' },
              { label: 'CA Confirmé (FCFA)', value: Math.round(stats.revenue.total / 1000) + 'k', icon: '💰' },
            ].map(st => (
              <div key={st.label} style={s.statCard}>
                <div style={s.statIcon}>{st.icon}</div>
                <div style={s.statValue}>{st.value}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab header */}
        <div style={s.tabBar}>
          {tabs.map(t => (
            <button key={t.id}
              style={{ ...s.tabBtn, ...(tab === t.id ? s.tabBtnActive : {}) }}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Panel: Week orders ── */}
        {tab === 'orders' && (
          <div style={s.panel}>
            <div style={s.panelTitle}>Commandes — Semaines régulières</div>
            {lWeek ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div> :
            weekOrders.length === 0 ? <p style={s.empty}>Aucune commande.</p> :
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 780 }}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Semaine</th>
                    <th>Commande</th>
                    <th>Montant</th>
                    <th>Acompte Wave</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weekOrders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.client_name}</strong><br />
                        <span style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{o.client_phone}</span><br />
                        <span style={{ fontSize: '0.68rem', color: 'var(--gray)' }}>{o.client_email}</span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{o.week_label}</td>
                      <td style={{ fontSize: '0.78rem', maxWidth: 180 }}>{o.description}</td>
                      <td style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {Number(o.amount).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--bordeaux)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {Number(o.wave_amount).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.status] || 'badge-pending'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {o.status === 'pending_wave' && (
                            <button className="btn-sm" style={{ background: '#dbeafe', color: '#1e40af' }}
                              onClick={() => markWaveSent('week', o.id)}>
                              Wave ✓
                            </button>
                          )}
                          {o.status !== 'confirmed' && o.status !== 'cancelled' && (
                            <button className="btn-sm btn-confirm" onClick={() => confirmOrder('week', o.id)}>
                              Confirmer
                            </button>
                          )}
                          {o.status !== 'cancelled' && (
                            <button className="btn-sm btn-cancel" onClick={() => cancelOrder('week', o.id)}>
                              ✕
                            </button>
                          )}
                        </div>
                        {o.admin_note && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--gray)', marginTop: '0.3rem' }}>
                            📝 {o.admin_note}
                          </div>
                        )}
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
          <div style={s.panel}>
            <div style={s.panelTitle}>Commandes — Événements spéciaux</div>
            {lEvent ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div> :
            eventOrders.length === 0 ? <p style={s.empty}>Aucune commande événement.</p> :
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Événement</th>
                    <th>Tenue</th>
                    <th>Montant</th>
                    <th>Acompte Wave</th>
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
                      <td style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {Number(o.amount).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--bordeaux)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {Number(o.wave_amount).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[o.status] || 'badge-pending'}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {o.status === 'pending_wave' && (
                            <button className="btn-sm" style={{ background: '#dbeafe', color: '#1e40af' }}
                              onClick={() => markWaveSent('event', o.id)}>
                              Wave ✓
                            </button>
                          )}
                          {o.status !== 'confirmed' && o.status !== 'cancelled' && (
                            <button className="btn-sm btn-confirm" onClick={() => confirmOrder('event', o.id)}>
                              Confirmer
                            </button>
                          )}
                          {o.status !== 'cancelled' && (
                            <button className="btn-sm btn-cancel" onClick={() => cancelOrder('event', o.id)}>
                              ✕
                            </button>
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
          <div style={s.panel}>
            <div style={s.panelTitle}>Clients inscrits</div>
            {lClients ? <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div> :
            clients.length === 0 ? <p style={s.empty}>Aucun client.</p> :
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Inscrit le</th>
                    <th>Cmd semaines</th>
                    <th>Cmd événements</th>
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
                      <td style={{ textAlign: 'center' }}>{c.week_orders}</td>
                      <td style={{ textAlign: 'center' }}>{c.event_orders}</td>
                      <td>
                        <span className={`badge ${c.is_active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                          {c.is_active ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn-sm ${c.is_active ? 'btn-cancel' : 'btn-confirm'}`}
                          onClick={() => toggleClient.mutate(c.id)}
                        >
                          {c.is_active ? 'Désactiver' : 'Activer'}
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

const s = {
  page: {
    display: 'flex', minHeight: '100vh',
    background: 'var(--cream)', paddingTop: 70,
  },
  sidebar: {
    width: 240, minHeight: 'calc(100vh - 70px)',
    background: 'var(--bordeaux-deep)',
    padding: '2rem 1rem',
    display: 'flex', flexDirection: 'column',
    borderRight: '1px solid rgba(201,168,76,0.15)',
    flexShrink: 0,
    position: 'sticky', top: 70, height: 'calc(100vh - 70px)',
  },
  sidebarLogo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2rem', fontWeight: 700,
    color: 'var(--gold-light)', textAlign: 'center', marginBottom: '0.2rem',
  },
  sidebarLabel: {
    fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase',
    color: 'rgba(250,248,245,0.35)', textAlign: 'center', marginBottom: '2rem',
  },
  sidebarNav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  sidebarBtn: {
    background: 'none', border: 'none', width: '100%',
    color: 'rgba(250,248,245,0.6)', padding: '0.75rem 1rem',
    borderRadius: '3px', cursor: 'pointer', textAlign: 'left',
    display: 'flex', alignItems: 'center', transition: 'all 0.2s',
    fontFamily: 'Montserrat, sans-serif',
  },
  sidebarBtnActive: {
    background: 'rgba(201,168,76,0.15)',
    color: 'var(--gold-light)',
    borderLeft: '3px solid var(--gold)',
  },
  logoutSidebar: {
    background: 'none', border: '1px solid rgba(250,248,245,0.12)',
    color: 'rgba(250,248,245,0.4)', padding: '0.6rem 1rem',
    borderRadius: '3px', cursor: 'pointer', fontSize: '0.72rem',
    letterSpacing: '0.08em', fontFamily: 'Montserrat, sans-serif',
    marginTop: '1rem', textAlign: 'left',
  },
  main: { flex: 1, padding: '2rem', overflowX: 'hidden' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--white)', border: '1px solid var(--gray-light)',
    borderRadius: '4px', padding: '1.2rem',
    boxShadow: 'var(--shadow-sm)', textAlign: 'center',
  },
  statIcon: { fontSize: '1.5rem', marginBottom: '0.4rem' },
  statValue: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2rem', fontWeight: 600, color: 'var(--bordeaux-deep)', lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--gray)', marginTop: '0.3rem',
  },
  tabBar: {
    display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem',
  },
  tabBtn: {
    padding: '0.55rem 1.1rem',
    background: 'var(--white)', border: '1px solid var(--gray-light)',
    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--gray)',
    cursor: 'pointer', borderRadius: '3px', transition: 'all 0.2s',
    fontFamily: 'Montserrat, sans-serif',
  },
  tabBtnActive: {
    background: 'var(--bordeaux-deep)', borderColor: 'var(--bordeaux-deep)', color: 'var(--white)',
  },
  panel: {
    background: 'var(--white)', border: '1px solid var(--gray-light)',
    borderRadius: '4px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
  },
  panelTitle: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--gray-light)',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.2rem', fontWeight: 600, color: 'var(--bordeaux-deep)',
    background: 'var(--cream)',
  },
  empty: { padding: '2rem', color: 'var(--gray)', fontSize: '0.85rem', textAlign: 'center' },
};
