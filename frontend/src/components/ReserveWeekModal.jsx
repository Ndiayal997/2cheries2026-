// src/components/ReserveWeekModal.jsx
import { useState } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ReserveWeekModal({ open, onClose, week, onSuccess }) {
  const [form, setForm] = useState({ description: '', amount: '' });
  const [step, setStep] = useState(1); // 1=form, 2=wave confirmation
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const waveAmount = form.amount ? Math.ceil(parseInt(form.amount) / 2) : 0;

  const handleCalc = (e) => {
    e?.preventDefault();
    setError('');
    if (!form.description.trim()) { setError('Décrivez votre commande.'); return; }
    const amt = parseInt(form.amount);
    if (!amt || amt < 1000) { setError('Montant invalide (minimum 1 000 FCFA).'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post(`/weeks/${week.id}/reserve`, {
        description: form.description,
        amount: parseInt(form.amount),
      });
      toast.success('Réservation créée ! Envoyez la moitié par Wave.');
      onSuccess?.();
      onClose();
      setForm({ description: '', amount: '' });
      setStep(1);
    } catch (err) {
      setError(err.error || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ description: '', amount: '' });
    setStep(1); setError('');
    onClose();
  };

  if (!week) return null;

  return (
    <Modal open={open} onClose={handleClose} title={`Semaine du ${week.label}`}>
      {error && <div className="form-error">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleCalc}>
          <div className="form-group">
            <label className="form-label">Description de votre commande</label>
            <input className="form-input" type="text"
              placeholder="Ex: Robe bazin bleu, boubou blanc cérémonial..."
              value={form.description}
              onChange={e => set('description', e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Montant estimé (FCFA)</label>
            <input className="form-input" type="number" min="1000"
              placeholder="Ex: 25 000"
              value={form.amount}
              onChange={e => set('amount', e.target.value)} />
          </div>
          <button type="submit" className="btn-bordeaux" style={{ width: '100%', justifyContent: 'center' }}>
            Calculer l'acompte Wave →
          </button>
        </form>
      )}

      {step === 2 && (
        <div>
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>Commande</span>
              <strong>{form.description}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Montant total</span>
              <strong>{parseInt(form.amount).toLocaleString('fr-FR')} FCFA</strong>
            </div>
          </div>

          <div style={styles.waveBox}>
            <div style={styles.waveLabel}>Envoyez la moitié par Wave au</div>
            <div style={styles.waveNum}>78 157 32 91</div>
            <div style={styles.waveAmt}>
              {waveAmount.toLocaleString('fr-FR')} FCFA
              <span style={{ fontSize: '0.72rem', color: 'var(--gray)', marginLeft: '0.5rem' }}>(50% du total)</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.8rem', lineHeight: 1.6 }}>
              Après envoi, soumettez votre réservation. L'administrateur confirmera votre paiement Wave sous 24h.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>
              ← Modifier
            </button>
            <button
              className="btn-bordeaux" style={{ flex: 2, justifyContent: 'center' }}
              onClick={handleSubmit} disabled={loading}
            >
              {loading ? 'Envoi...' : '✓ Confirmer la réservation'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const styles = {
  summary: {
    background: 'var(--cream)', border: '1px solid var(--gray-light)',
    borderRadius: '4px', padding: '1rem 1.2rem', marginBottom: '1rem',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '0.82rem', padding: '0.3rem 0',
    borderBottom: '1px solid var(--gray-light)',
    gap: '1rem',
  },
  waveBox: {
    background: 'var(--bordeaux-deep)', borderRadius: '4px',
    padding: '1.5rem', textAlign: 'center',
    border: '1px solid rgba(201,168,76,0.3)',
  },
  waveLabel: {
    fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase',
    color: 'rgba(250,248,245,0.6)', marginBottom: '0.4rem',
  },
  waveNum: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2rem', fontWeight: 700, color: 'var(--gold-light)',
    letterSpacing: '0.15em',
  },
  waveAmt: {
    fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', marginTop: '0.4rem',
  },
};
