// src/components/Countdown.jsx
import { useState, useEffect } from 'react';

export default function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    return {
      days:  Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins:  Math.floor((diff % 3600000) / 60000),
      secs:  Math.floor((diff % 60000) / 1000),
    };
  }

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  if (!timeLeft) return (
    <div style={{ color: 'var(--gold-light)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem' }}>
      C'est aujourd'hui !
    </div>
  );

  const blocks = [
    { value: timeLeft.days,  label: 'Jours' },
    { value: timeLeft.hours, label: 'Heures' },
    { value: timeLeft.mins,  label: 'Minutes' },
    { value: timeLeft.secs,  label: 'Secondes' },
  ];

  return (
    <div style={styles.wrap}>
      {blocks.map((b, i) => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={styles.block}>
            <div style={styles.num}>{String(b.value).padStart(2, '0')}</div>
            <div style={styles.label}>{b.label}</div>
          </div>
          {i < 3 && <span style={styles.sep}>:</span>}
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '0.2rem',
    flexWrap: 'wrap',
  },
  block: { textAlign: 'center', minWidth: '60px' },
  num: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    fontWeight: 700, color: 'var(--white)', lineHeight: 1,
  },
  label: {
    fontSize: '0.6rem', letterSpacing: '0.2em',
    textTransform: 'uppercase', color: 'var(--gold)',
    marginTop: '0.3rem',
  },
  sep: {
    color: 'rgba(250,248,245,0.3)',
    fontSize: '1.8rem', fontWeight: 300,
    marginBottom: '1.2rem',
  },
};
