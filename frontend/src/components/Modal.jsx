// src/components/Modal.jsx
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 480 }) {
  // Fermer avec Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Bloquer le scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...styles.modal, maxWidth }} className="fade-in">
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button style={styles.close} onClick={onClose}>×</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(26,10,13,0.85)',
    zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: 'var(--white)',
    width: '100%',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 20px 80px rgba(107,15,26,0.4)',
  },
  header: {
    background: 'var(--bordeaux-deep)',
    padding: '1.4rem 2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem', fontWeight: 600,
    color: 'var(--gold-light)',
  },
  close: {
    background: 'none', border: 'none',
    color: 'rgba(250,248,245,0.5)',
    fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1,
  },
  body: { padding: '1.8rem 2rem' },
};
