// src/pages/MyOrdersPage.jsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const STATUS_LABELS = {
  pending_wave: 'En attente Wave',
  wave_sent:    'Wave envoyé',
  confirmed:    'Confirmé',
  cancelled:    'Annulé',
};
const STATUS_BADGE = {
  pending_wave: 'badge-pending',
  wave_sent:    'badge-wave',
  confirmed:    'badge-confirmed',
  cancelled:    'badge-cancelled',
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: weekOrders = [], isLoading: l1 } = useQuery({
    queryKey: ['myWeekOrders'],
    queryFn: () => api.get('/weeks/orders/mine').then(r => r.data),
    enabled: !!user,
  });

  const { data: eventOrders = [], isLoading: l2 } = useQuery({
    queryKey: ['myEventOrders'],
    queryFn: () => api.get('/events/orders/mine').then(r => r.data),
    enabled: !!user,
  });

  const all = [
    ...weekOrders.map(o => ({ ...o, _type: 'week' })),
    ...eventOrders.map(o => ({ ...o, _type: 'event' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const loading = l1 || l2;

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.header}>
          <div>
            <div className="section-label">Mon espace</div>
            <div className="section-title">Mes <em>commandes</em></div>
          </div>
          <button className="btn-outline" onClick={() => navigate('/')}>← Retour</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && all.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: 'var(--bordeaux-deep)', marginBottom: '0.5rem' }}>
              Aucune commande
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>
              Réservez une place dans le calendrier pour commencer.
            </p>
            <button className="btn-primary" onClick={() => navigate('/#calendar')}>
              Voir le calendrier
            </button>
          </div>
        )}

        {!loading && all.map(order => (
          <div key={order.id} style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardType}>
                {order._type === 'event'
                  ? `${order.icon || '🌟'} ${order.event_name}`
                  : `📅 Semaine ${order.week_label}`
                }
              </div>
              <span className={`badge ${STATUS_BADGE[order.status] || 'badge-pending'}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div style={s.cardBody}>
              <div style={s.infoRow}><span>Commande</span><strong>{order.description}</strong></div>
              <div style={s.infoRow}>
                <span>Montant total</span>
                <strong>{Number(order.amount).toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div style={s.infoRow}>
                <span>Acompte Wave (50%)</span>
                <strong style={{ color: 'var(--bordeaux)' }}>{Number(order.wave_amount).toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div style={s.infoRow}>
                <span>Date</span>
                <span>{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {order.status === 'pending_wave' && (
              <div style={s.waveAlert}>
                <strong>⚡ Action requise :</strong> Envoyez{' '}
                <strong>{Number(order.wave_amount).toLocaleString('fr-FR')} FCFA</strong>
                {' '}par Wave au <strong>78 157 32 91</strong> pour valider votre réservation.
              </div>
            )}

            {order.status === 'confirmed' && (
              <div style={s.confirmedBanner}>
                ✅ Commande confirmée par l'administrateur
              </div>
            )}

            {order.admin_note && (
              <div style={s.adminNote}>
                <strong>Note admin :</strong> {order.admin_note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { background: 'var(--cream)', minHeight: '100vh', paddingTop: 70 },
  wrap: { maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '2rem', paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--gray-light)',
    flexWrap: 'wrap', gap: '1rem',
  },
  empty: {
    textAlign: 'center', padding: '4rem 2rem',
    background: 'var(--white)', borderRadius: '4px',
    border: '1px solid var(--gray-light)',
  },
  card: {
    background: 'var(--white)', border: '1px solid var(--gray-light)',
    borderRadius: '4px', marginBottom: '1.2rem',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  },
  cardHeader: {
    padding: '1rem 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--gray-light)',
    background: 'var(--cream)',
  },
  cardType: { fontWeight: 600, fontSize: '0.88rem', color: 'var(--bordeaux-deep)' },
  cardBody: { padding: '1.2rem 1.5rem' },
  infoRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.82rem', padding: '0.35rem 0',
    borderBottom: '1px solid var(--gray-light)',
    gap: '1rem', flexWrap: 'wrap',
  },
  waveAlert: {
    background: '#fefce8', borderTop: '1px solid #fef08a',
    padding: '0.9rem 1.5rem', fontSize: '0.8rem', color: '#713f12',
    lineHeight: 1.6,
  },
  confirmedBanner: {
    background: '#f0fdf4', borderTop: '1px solid #bbf7d0',
    padding: '0.9rem 1.5rem', fontSize: '0.8rem', color: '#166534',
  },
  adminNote: {
    background: '#f0f9ff', borderTop: '1px solid #bae6fd',
    padding: '0.9rem 1.5rem', fontSize: '0.8rem', color: '#075985',
  },
};
