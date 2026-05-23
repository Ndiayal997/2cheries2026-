// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={s.page}>
      <div style={s.orb1} /><div style={s.orb2} />
      <div style={s.content}>
        <div style={s.code}>404</div>
        <div style={s.title}>Page <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>introuvable</em></div>
        <p style={s.text}>La page que vous cherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" style={s.link}>← Retour à l'accueil</Link>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, var(--bordeaux-deep) 0%, var(--bordeaux) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  orb1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    border: '1px solid rgba(201,168,76,0.1)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', width: 700, height: 700, borderRadius: '50%',
    border: '1px solid rgba(201,168,76,0.05)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  },
  content: { position: 'relative', textAlign: 'center', padding: '2rem' },
  code: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(5rem, 15vw, 10rem)',
    fontWeight: 300, color: 'rgba(250,248,245,0.12)',
    lineHeight: 1, marginBottom: '-1rem',
    letterSpacing: '-0.04em',
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 300, color: 'var(--white)',
    lineHeight: 1.1, marginBottom: '1rem',
  },
  text: {
    fontSize: '0.85rem', color: 'rgba(250,248,245,0.55)',
    letterSpacing: '0.05em', marginBottom: '2.5rem', lineHeight: 1.7,
  },
  link: {
    display: 'inline-block',
    color: 'var(--gold)',
    fontSize: '0.8rem', fontWeight: 600,
    letterSpacing: '0.2em', textTransform: 'uppercase',
    textDecoration: 'none',
    padding: '0.9rem 2rem',
    border: '1px solid rgba(201,168,76,0.4)',
    borderRadius: '2px',
    transition: 'all 0.2s',
  },
};
