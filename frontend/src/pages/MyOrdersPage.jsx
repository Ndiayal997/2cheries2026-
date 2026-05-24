import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import './MyOrdersPage.css';

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
    <div className="orders-page">
      <div className="orders-wrap">
        <div className="orders-header">
          <div>
            <div className="section-label">Mon espace</div>
            <div className="section-title">Mes <em>commandes</em></div>
          </div>
          <button className="btn-outline" onClick={() => navigate('/')}>Retour</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && all.length === 0 && (
          <div className="orders-empty">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: 'var(--bordeaux-deep)', marginBottom: '0.5rem' }}>
              Aucune commande
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>
              Réservez une place dans le calendrier pour commencer.
            </p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Voir le calendrier
            </button>
          </div>
        )}

        {!loading && all.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-card-header">
              <div className="order-card-type">
                {order._type === 'event'
                  ? (order.icon || '🌟') + ' ' + order.event_name
                  : '📅 Semaine ' + order.week_label
                }
              </div>
              <span className={'badge ' + (STATUS_BADGE[order.status] || 'badge-pending')}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="order-card-body">
              <div className="order-info-row"><span>Commande</span><strong>{order.description}</strong></div>
              <div className="order-info-row">
                <span>Montant total</span>
                <strong>{Number(order.amount).toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div className="order-info-row">
                <span>Acompte Wave (50%)</span>
                <strong style={{ color: 'var(--bordeaux)' }}>{Number(order.wave_amount).toLocaleString('fr-FR')} FCFA</strong>
              </div>
              <div className="order-info-row">
                <span>Date</span>
                <span>{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {order.status === 'pending_wave' && (
              <div className="order-wave-alert">
                <strong>⚡ Action requise :</strong> Envoyez{' '}
                <strong>{Number(order.wave_amount).toLocaleString('fr-FR')} FCFA</strong>
                {' '}par Wave au <strong>78 157 32 91</strong> pour valider votre réservation.
              </div>
            )}

            {order.status === 'confirmed' && (
              <div className="order-confirmed-banner">
                ✅ Commande confirmée par l'administrateur
              </div>
            )}

            {order.admin_note && (
              <div className="order-admin-note">
                <strong>Note admin :</strong> {order.admin_note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
