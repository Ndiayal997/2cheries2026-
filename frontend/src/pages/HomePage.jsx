import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Countdown from '../components/Countdown';
import ReserveWeekModal from '../components/ReserveWeekModal';
import ReserveEventModal from '../components/ReserveEventModal';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selWeek, setSelWeek] = useState(null);
  const [selEvent, setSelEvent] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks'],
    queryFn: () => api.get('/weeks').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
    refetchInterval: 60000,
  });

  const magal = events.find(e => e.id === 'magal_touba');
  const spotsLeft = magal ? magal.spots_left : '—';
  const closedWeeks = weeks.filter(w => w.is_closed);
  const activeWeeks = weeks.filter(w => !w.is_closed);

  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === 'week') setSelWeek(pendingAction.data);
      if (pendingAction.type === 'event') setSelEvent(pendingAction.data);
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  const handleReserveWeek = (week) => {
    if (!user) {
      setPendingAction({ type: 'week', data: week });
      setShowLogin(true);
    } else {
      setSelWeek(week);
    }
  };

  const handleReserveEvent = (event) => {
    if (!user) {
      setPendingAction({ type: 'event', data: event });
      setShowLogin(true);
    } else {
      setSelEvent(event);
    }
  };

  return (
    <div className="home-page">
      <Navbar onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            2<em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>C</em>heries <br />
            <span style={{ fontSize: '0.8em', fontWeight: 300, letterSpacing: '0.1em' }}>HAUTE COUTURE</span>
          </h1>
          <p className="hero-subtitle">L'excellence du sur-mesure sénégalais, de Touba à Dakar.</p>
          <div className="hero-badges">
            <span className="hero-badge">✨ Finition Prestige</span>
            <span className="hero-badge">📍 Livraison Rapide</span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container" style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        
        {/* Prochaines Semaines */}
        <div className="section-header">
          <h2 className="section-title">Calendrier des Confections</h2>
          <p className="section-desc">Choisissez votre semaine de livraison. 12 commandes maximum par semaine pour garantir une qualité irréprochable.</p>
        </div>

        <div className="calendar-wrap">
          {closedWeeks.map(week => (
            <div className="closed-week" key={week.id}>
              <span style={{ fontSize: '1.2rem' }}>🔒</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.85rem' }}>{week.label} · Semaine bouclée</strong>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.2rem' }}>
                  12/12 commandes enregistrées · Fermée aux nouvelles réservations
                </span>
              </div>
              <span className="badge badge-confirmed">Bouclée</span>
            </div>
          ))}

          {activeWeeks.map(week => {
            const pct = Math.min(100, Math.round((week.order_count / week.max_orders) * 100));
            return (
              <div key={week.id} className={'week-card ' + (week.is_full ? 'is-full' : '')}>
                <div className="week-header">
                  <div>
                    <h3 className="week-label">Semaine du {week.label}</h3>
                    <div className="week-meta">
                      {week.order_count}/{week.max_orders} commandes · {week.is_full ? 'Complet' : (week.max_orders - week.order_count) + ' places restantes'}
                    </div>
                  </div>
                  <span className={'badge ' + (week.is_full ? 'badge-full' : 'badge-open')}>
                    {week.is_full ? 'Complet' : 'Ouvert'}
                  </span>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: pct + '%' }}></div>
                </div>

                <button 
                  className="btn-reserve" 
                  disabled={week.is_full}
                  onClick={() => handleReserveWeek(week)}
                >
                  {week.is_full ? 'Indisponible' : 'Réserver pour cette semaine'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Evénements Spéciaux */}
        <div className="section-header" style={{ marginTop: '4rem' }}>
          <h2 className="section-title">Événements Spéciaux 2026</h2>
          <p className="section-desc">Réservations prioritaires pour les grandes célébrations de l'année.</p>
        </div>

        <div className="events-grid">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-icon">{event.icon}</div>
              <h3 className="event-name">{event.name}</h3>
              <div className="event-date">{event.event_date}</div>
              <p className="event-desc">{event.description}</p>
              
              <div style={{ marginTop: 'auto' }}>
                <div className="event-spots">
                  Places : <strong>{event.max_spots - (event.order_count || 0)}/{event.max_spots}</strong> restantes
                </div>
                <button className="btn-event" onClick={() => handleReserveEvent(event)}>
                  Réserver ma tenue
                </button>
                <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--gray)', marginTop: '0.6rem' }}>
                  Clôture : {event.deadline}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>© 2026 2Cheries Haute Couture · Dakar, Sénégal</p>
        <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem' }}>Excellence · Tradition · Modernité</p>
      </footer>

      {/* Modals */}
      {selWeek && (
        <ReserveWeekModal 
          open={!!selWeek} 
          week={selWeek} 
          onClose={() => setSelWeek(null)} 
        />
      )}
      {selEvent && (
        <ReserveEventModal 
          open={!!selEvent} 
          event={selEvent} 
          onClose={() => setSelEvent(null)} 
        />
      )}
      <LoginModal 
        open={showLogin} 
        onClose={() => setShowLogin(false)} 
        onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
      />
      <RegisterModal 
        open={showRegister} 
        onClose={() => setShowRegister(false)} 
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
      />
    </div>
  );
}
