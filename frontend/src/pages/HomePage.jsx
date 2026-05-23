// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Countdown from '../components/Countdown';
import ReserveWeekModal from '../components/ReserveWeekModal';
import ReserveEventModal from '../components/ReserveEventModal';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

export default function HomePage() {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // {type:'week'|'event', data}

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

  // After login, trigger pending action
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.heroOrb1} /><div style={s.heroOrb2} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 1rem' }}>
          <div style={s.heroTag} className="fade-up">✦ Atelier de Mode Exclusif ✦</div>
          <h1 style={s.heroTitle} className="fade-up">
            2<em style={{ fontStyle: 'italic', color: 'var(--gold-light)', display: 'block' }}>Cheries</em>
          </h1>
          <p style={s.heroSub} className="fade-up">Commandes sur mesure · Livraison soignée · Style intemporel</p>
          <div style={s.heroCta} className="fade-up">
            <button className="btn-primary" onClick={() => scrollTo('calendar')}>Réserver ma place</button>
            <button className="btn-outline" style={{ color: 'var(--white)', borderColor: 'rgba(250,248,245,0.4)' }}
              onClick={() => scrollTo('events')}>Événements spéciaux</button>
          </div>
        </div>
      </section>

      {/* ── MAGAL BANNER ── */}
      <div style={s.eventBanner}>
        <div style={s.bannerLabel}>✦ Événement Grand Format ✦</div>
        <div style={s.bannerTitle}>Magal de Touba 2026</div>
        <div style={s.bannerSub}>2 Août 2026 · 30 places · Ouverture jusqu'au 20 Juillet</div>
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-primary"
            onClick={() => magal && handleReserveEvent(magal)}>
            Réserver pour le Magal
          </button>
          <span style={s.spotsTag}>{spotsLeft} place{spotsLeft !== 1 ? 's' : ''} restante{spotsLeft !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="divider" />

      {/* ── CALENDAR ── */}
      <section style={s.section} id="calendar">
        <div className="text-center">
          <div className="section-label">Planning des commandes</div>
          <div className="section-title">Calendrier <em>des réservations</em></div>
          <p style={s.sectionSub}>12 commandes maximum par semaine. Confirmez par Wave pour valider.</p>
        </div>

        <div style={s.calendarWrap}>
          {/* Semaine bouclée */}
          <div style={s.closedWeek}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.85rem' }}>1er – 7 Juin 2026 · Semaine bouclée</strong>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.2rem' }}>
                12/12 commandes atteintes · Fermée aux nouvelles réservations
              </span>
            </div>
            <span className="badge badge-confirmed">Complet</span>
          </div>

          {/* Semaines dynamiques */}
          {activeWeeks.map(week => {
            const pct = Math.min(100, Math.round((week.order_count / week.max_orders) * 100));
            const isFull = week.is_full;
            return (
              <div key={week.id} style={s.weekCard}>
                <div style={s.weekHeader}>
                  <span style={s.weekTitle}>Semaine du {week.label}</span>
                  <span className={`badge ${isFull ? 'badge-full' : week.is_current_open ? 'badge-open' : 'badge-cancelled'}`}
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
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
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

          {/* Countdown Magal */}
          <div style={s.countdownBox}>
            <div style={s.countdownTitle}>✦ Magal de Touba ✦</div>
            <div style={s.countdownDate}>Grand Rendez-vous · 2 Août 2026</div>
            <Countdown targetDate="2026-08-02T00:00:00" />
            <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'rgba(250,248,245,0.7)' }}>
              Places restantes : <strong style={{ color: 'var(--gold-light)', fontSize: '1.1rem' }}>{spotsLeft}</strong> / 30
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── HOW IT WORKS ── */}
      <section style={s.section} id="how">
        <div className="text-center">
          <div className="section-label">Processus</div>
          <div className="section-title">Comment <em>réserver</em></div>
        </div>
        <div style={s.stepsGrid}>
          {[
            { n: '01', t: 'Créer un compte', d: 'Inscrivez-vous avec votre nom, email et numéro de téléphone.' },
            { n: '02', t: 'Choisir un créneau', d: 'Sélectionnez la semaine disponible et réservez votre place.' },
            { n: '03', t: 'Confirmer par Wave', d: 'Envoyez 50% du montant au 78 157 32 91 pour valider.' },
            { n: '04', t: 'Validation admin', d: 'L\'administrateur confirme votre paiement et finalise la commande.' },
          ].map(step => (
            <div key={step.n} style={s.step}>
              <div style={s.stepNum}>{step.n}</div>
              <div style={s.stepTitle}>{step.t}</div>
              <div style={s.stepText}>{step.d}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── EVENTS ── */}
      <section style={{ ...s.section, background: 'var(--bordeaux-deep)' }} id="events">
        <div className="text-center">
          <div className="section-label" style={{ color: 'var(--gold)' }}>Calendrier religieux & culturel</div>
          <div className="section-title light">Événements <em>spéciaux</em></div>
          <p style={{ ...s.sectionSub, color: 'rgba(250,248,245,0.55)' }}>30 à 40 places par événement. Réservez en avance.</p>
        </div>
        <div style={s.eventsGrid}>
          {events.map(ev => (
            <div key={ev.id} style={s.eventCard} onClick={() => handleReserveEvent(ev)}>
              <div style={s.eventIcon}>{ev.icon}</div>
              <div style={{ padding: '1.2rem' }}>
                <div style={s.eventName}>{ev.name}</div>
                <div style={s.eventDate}>{ev.event_date}</div>
                <div style={s.eventDesc}>{ev.description}</div>
                <div style={s.eventSpots}>
                  {ev.is_full ? '⚠️ Complet' : `${ev.spots_left} place${ev.spots_left > 1 ? 's' : ''} / ${ev.max_spots}`}
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

      {/* ── WAVE ── */}
      <section style={s.waveSection} id="wave">
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
          Confirmation de paiement
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '4rem', fontWeight: 700, color: 'var(--gold-light)' }}>
          Wave
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--white)', margin: '0.8rem 0' }}>
          78 157 32 91
        </div>
        <p style={{ fontSize: '0.82rem', color: 'rgba(250,248,245,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.8 }}>
          Envoyez la moitié du montant total de votre commande à ce numéro Wave pour valider votre réservation.
          L'administrateur confirmera votre paiement sous 24h.
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <strong style={{ color: 'var(--gold)' }}>2Cheries</strong> · Atelier de Mode Exclusif · Dakar, Sénégal
        <br />
        <span style={{ fontSize: '0.65rem', opacity: 0.4, display: 'block', marginTop: '0.4rem' }}>
          © 2026 · Tous droits réservés
        </span>
      </footer>

      {/* Modals */}
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

/* ── Styles ── */
const s = {
  hero: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, var(--bordeaux-deep) 0%, var(--bordeaux) 50%, var(--bordeaux-light) 100%)',
    position: 'relative', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '100px 2rem 60px', overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    border: '1px solid rgba(201,168,76,0.1)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  },
  heroOrb2: {
    position: 'absolute', width: 700, height: 700, borderRadius: '50%',
    border: '1px solid rgba(201,168,76,0.05)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  },
  heroTag: {
    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.3em',
    textTransform: 'uppercase', color: 'var(--gold)',
    border: '1px solid rgba(201,168,76,0.4)',
    padding: '0.4rem 1.2rem', borderRadius: '2px',
    display: 'inline-block', marginBottom: '2rem',
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(3.5rem, 9vw, 7rem)',
    fontWeight: 300, color: 'var(--white)',
    lineHeight: 1.05, letterSpacing: '-0.01em',
  },
  heroSub: {
    marginTop: '1.5rem', fontSize: '0.82rem', fontWeight: 300,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(250,248,245,0.7)',
  },
  heroCta: {
    display: 'flex', gap: '1rem', flexWrap: 'wrap',
    justifyContent: 'center', marginTop: '3rem',
  },
  eventBanner: {
    background: 'linear-gradient(90deg, var(--bordeaux-deep), var(--bordeaux), var(--bordeaux-deep))',
    borderTop: '1px solid rgba(201,168,76,0.3)',
    borderBottom: '1px solid rgba(201,168,76,0.3)',
    padding: '2rem 2rem', textAlign: 'center',
  },
  bannerLabel: {
    fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
    color: 'var(--gold)', fontWeight: 600, marginBottom: '0.5rem',
  },
  bannerTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, color: 'var(--white)',
  },
  bannerSub: { fontSize: '0.78rem', color: 'rgba(250,248,245,0.65)', marginTop: '0.3rem', letterSpacing: '0.08em' },
  spotsTag: {
    background: 'rgba(201,168,76,0.15)',
    border: '1px solid rgba(201,168,76,0.4)',
    color: 'var(--gold-light)',
    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em',
    padding: '0.4rem 1rem', borderRadius: '2px',
  },
  section: { padding: '5rem 2rem' },
  sectionSub: {
    fontSize: '0.82rem', color: 'var(--gray)',
    maxWidth: 500, margin: '0.8rem auto 0', lineHeight: 1.7, textAlign: 'center',
  },
  calendarWrap: { maxWidth: 860, margin: '3rem auto 0' },
  closedWeek: {
    background: 'rgba(107,15,26,0.06)',
    border: '1px solid rgba(107,15,26,0.12)',
    borderRadius: '4px', padding: '1rem 1.5rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
    marginBottom: '0.8rem',
  },
  weekCard: {
    background: 'var(--white)', border: '1px solid var(--gray-light)',
    borderRadius: '4px', marginBottom: '1rem',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    transition: 'box-shadow 0.2s',
  },
  weekHeader: {
    background: 'var(--bordeaux-deep)', color: 'var(--white)',
    padding: '1rem 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  weekTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.2rem', fontWeight: 600,
  },
  countdownBox: {
    background: 'linear-gradient(135deg, var(--bordeaux-deep), var(--bordeaux))',
    border: '1px solid rgba(201,168,76,0.3)',
    borderRadius: '4px', padding: '2rem',
    textAlign: 'center', marginTop: '2rem',
  },
  countdownTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem', fontWeight: 600, color: 'var(--gold-light)', marginBottom: '0.4rem',
  },
  countdownDate: {
    fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(250,248,245,0.55)', marginBottom: '1.2rem',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.5rem', maxWidth: 900, margin: '3rem auto 0',
  },
  step: {
    textAlign: 'center', padding: '2rem 1.5rem',
    border: '1px solid var(--gray-light)', borderRadius: '4px',
  },
  stepNum: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '3rem', fontWeight: 300,
    color: 'var(--bordeaux-pale)', lineHeight: 1, marginBottom: '0.8rem',
  },
  stepTitle: {
    fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--bordeaux-deep)', marginBottom: '0.5rem',
  },
  stepText: { fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6 },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1.5rem', maxWidth: 1000, margin: '3rem auto 0',
  },
  eventCard: {
    background: 'rgba(74,10,18,0.7)',
    border: '1px solid rgba(201,168,76,0.2)',
    borderRadius: '4px', overflow: 'hidden',
    cursor: 'pointer', transition: 'all 0.25s',
  },
  eventIcon: {
    height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bordeaux), var(--bordeaux-light))',
    fontSize: '2.2rem',
  },
  eventName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.3rem', fontWeight: 600,
    color: 'var(--gold-light)', marginBottom: '0.3rem',
  },
  eventDate: { fontSize: '0.72rem', color: 'rgba(250,248,245,0.55)', letterSpacing: '0.1em' },
  eventDesc: { fontSize: '0.72rem', color: 'rgba(250,248,245,0.45)', marginTop: '0.4rem', lineHeight: 1.5 },
  eventSpots: { marginTop: '0.7rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em' },
  waveSection: {
    background: 'var(--bordeaux-deep)',
    padding: '4rem 2rem', textAlign: 'center',
  },
  footer: {
    background: 'var(--text-dark)',
    color: 'rgba(250,248,245,0.45)',
    textAlign: 'center', padding: '2rem',
    fontSize: '0.75rem', letterSpacing: '0.08em',
  },
};
