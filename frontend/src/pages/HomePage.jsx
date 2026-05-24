import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Countdown from '../components/Countdown';
import ReserveWeekModal from '../components/ReserveWeekModal';
import ReserveEventModal from '../components/ReserveEventModal';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); 

  const { data: weeks = [], refetch: refetchWeeks } = useQuery({
    queryKey: ['weeks'],
    queryFn: () => api.get('/weeks').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data),
    refetchInterval: 30000,
  });

  const magal = events.find(e => e.id === 'magal_touba');
  const spotsLeft = magal ? magal.spots_left : '—';
  const activeWeeks = weeks.filter(w => w.id !== 'w0');

  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === 'week') setSelectedWeek(pendingAction.data);
      if (pendingAction.type === 'event') setSelectedEvent(pendingAction.data);
      setPendingAction(null);
    }
  }, [user]);

  const handleReserveWeek = (week) => {
    if (!user) { setPendingAction({ type: 'week', data: week }); setShowLogin(true); return; }
    setSelectedWeek(week);
  };

  const handleReserveEvent = (event) => {
    if (!user) { setPendingAction({ type: 'event', data: event }); setShowLogin(true); return; }
    setSelectedEvent(event);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <section className="hero">
        <div className="hero-orb1" /><div className="hero-orb2" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-tag fade-up">✦ Atelier de Mode Exclusif ✦</div>
          <h1 className="hero-title fade-up">
            2<em style={{ fontStyle: 'italic', color: 'var(--gold-light)', display: 'block' }}>Cheries</em>
          </h1>
          <p className="hero-sub fade-up">Commandes sur mesure · Livraison soignée · Style intemporel</p>
          <div className="hero-cta fade-up" style={{ marginTop: '3rem' }}>
            <button className="btn-primary" onClick={() => scrollTo('calendar')}>Réserver ma place</button>
            <button className="btn-outline" style={{ color: 'var(--white)', borderColor: 'rgba(250,248,245,0.4)' }}
              onClick={() => scrollTo('events')}>Événements spéciaux</button>
          </div>
        </div>
      </section>

      <div className="event-banner">
        <div className="banner-label">✦ Événement Grand Format ✦</div>
        <div className="banner-title">Magal de Touba 2026</div>
        <div className="banner-sub">2 Août 2026 · 30 places · Ouverture jusqu'au 20 Juillet</div>
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-primary"
            onClick={() => magal && handleReserveEvent(magal)}>
            Réserver pour le Magal
          </button>
          <span className="spots-tag">{spotsLeft} place{spotsLeft !== 1 ? 's' : ''} restante{spotsLeft !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="divider" />

      <section className="section" id="calendar">
        <div className="text-center">
          <div className="section-label">Planning des commandes</div>
          <div className="section-title">Calendrier <em>des réservations</em></div>
          <p className="section-sub">12 commandes maximum par semaine. Confirmez par Wave pour valider.</p>
        </div>

        <div className="calendar-wrap">
          <div className="closed-week">
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.85rem' }}>1er – 7 Juin 2026 · Semaine bouclée</strong>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.2rem' }}>
                12/12 commandes atteintes · Fermée aux nouvelles réservations
              </span>
            </div>
            <span className="badge badge-confirmed">Complet</span>
          </div>

          {activeWeeks.map(week => {
            const pct = Math.min(100, Math.round((week.order_count / week.max_orders) * 100));
            const isFull = week.is_full;
            const badgeClass = 'badge ' + (isFull ? 'badge-full' : week.is_current_open ? 'badge-open' : 'badge-cancelled');
            return (
              <div key={week.id} className="week-card">
                <div className="week-header">
                  <span className="week-title">Semaine du {week.label}</span>
                  <span className={badgeClass}
                    style={!isFull && !week.is_current_open ? { background: '#555', color: '#ccc' } : {}}>
                    {isFull ? 'Complet' : week.is_current_open ? 'Ouvert' : 'À venir'}
                  </span>
                </div>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--gray-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--gray)', marginBottom: '0.4rem' }}>
                    <span>{week.order_count} commande{week.order_count > 1 ? 's' : ''} sur {week.max_orders}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: pct + '%' }} />
                  </div>
                </div>
                <div style={{ padding: '1rem 1.5rem' }}>
                  <button
                    className="btn-bordeaux"
                    style={{ width: '100%', justifyContent: 'center', opacity: (!week.is_current_open || isFull) ? 0.5 : 1 }}
                    disabled={!week.is_current_open || isFull}
                    onClick={() => handleReserveWeek(week)}
                  >
                    {isFull ? 'Complet' : week.is_current_open ? 'Réserver cette semaine' : 'Disponible prochainement'}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="countdown-box">
            <div className="countdown-title">✦ Magal de Touba ✦</div>
            <div className="countdown-date">Grand Rendez-vous · 2 Août 2026</div>
            <Countdown targetDate="2026-08-02T00:00:00" />
            <div style={{ marginTop: '1.5rem', fontSize: '0.82rem', color: 'rgba(250,248,245,0.7)' }}>
              Places restantes : <strong style={{ color: 'var(--gold-light)', fontSize: '1.1rem' }}>{spotsLeft}</strong> / 30
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="how">
        <div className="text-center">
          <div className="section-label">Processus</div>
          <div className="section-title">Comment <em>réserver</em></div>
        </div>
        <div className="steps-grid">
          {[
            { n: '01', t: 'Créer un compte', d: 'Inscrivez-vous avec votre nom, email et numéro de téléphone.' },
            { n: '02', t: 'Choisir un créneau', d: 'Sélectionnez la semaine disponible et réservez votre place.' },
            { n: '03', t: 'Confirmer par Wave', d: 'Envoyez 50% du montant au 78 157 32 91 pour valider.' },
            { n: '04', t: 'Validation admin', d: 'L\'administrateur confirme votre paiement et finalise la commande.' },
          ].map(step => (
            <div key={step.n} className="step">
              <div className="step-num">{step.n}</div>
              <div className="step-title">{step.t}</div>
              <div className="step-text">{step.d}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="section" style={{ background: 'var(--bordeaux-deep)' }} id="events">
        <div className="text-center">
          <div className="section-label" style={{ color: 'var(--gold)' }}>Calendrier religieux & culturel</div>
          <div className="section-title light">Événements <em>spéciaux</em></div>
          <p className="section-sub" style={{ color: 'rgba(250,248,245,0.55)' }}>30 à 40 places par événement. Réservez en avance.</p>
        </div>
        <div className="events-grid">
          {events.map(ev => (
            <div key={ev.id} className="event-card" onClick={() => handleReserveEvent(ev)}>
              <div className="event-icon">{ev.icon}</div>
              <div style={{ padding: '1.2rem' }}>
                <div className="event-name">{ev.name}</div>
                <div className="event-date">{ev.event_date}</div>
                <div className="event-desc">{ev.description}</div>
                <div className="event-spots">
                  {ev.is_full ? '⚠️ Complet' : ev.spots_left + ' place' + (ev.spots_left > 1 ? 's' : '') + ' / ' + ev.max_spots}
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: ev.is_full ? 0.5 : 1 }}
                  disabled={ev.is_full}
                  onClick={e => { e.stopPropagation(); handleReserveEvent(ev); }}
                >
                  {ev.is_full ? 'Complet' : 'Réserver'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wave-section" id="wave">
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
          Confirmation de paiement
        </div>
        <div className="wave-title">Wave</div>
        <div className="wave-number">78 157 32 91</div>
        <p style={{ fontSize: '0.82rem', color: 'rgba(250,248,245,0.6)', maxWidth: 480, margin: '0.8rem auto 0', lineHeight: 1.8 }}>
          Envoyez la moitié du montant total de votre commande à ce numéro Wave pour valider votre réservation.
          L'administrateur confirmera votre paiement sous 24h.
        </p>
      </section>

      <footer className="footer">
        <strong style={{ color: 'var(--gold)' }}>2Cheries</strong> · Atelier de Mode Exclusif · Dakar, Sénégal
        <br />
        <span style={{ fontSize: '0.65rem', opacity: 0.4, display: 'block', marginTop: '0.5rem' }}>
          © 2026 · Tous droits réservés
        </span>
      </footer>

      <ReserveWeekModal
        open={!!selectedWeek} week={selectedWeek}
        onClose={() => setSelectedWeek(null)}
        onSuccess={() => { refetchWeeks(); }}
      />
      <ReserveEventModal
        open={!!selectedEvent} event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSuccess={() => { refetchEvents(); }}
      />
      <LoginModal
        open={showLogin} onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }}
      />
      <RegisterModal
        open={showRegister} onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }}
      />
    </div>
  );
}
