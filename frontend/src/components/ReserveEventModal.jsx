// src/components/ReserveEventModal.jsx
import { useState } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ReserveEventModal({ open, onClose, event, onSuccess }) {
  const [form, setForm] = useState({ description: '', amount: '' });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const waveAmount = form.amount ? Math.ceil(parseInt(form.amount) / 2) : 0;

  const handleCalc = (e) => {
    e?.preventDefault();
    setError('');
    if (!form.description.trim()) { setError('Décrivez votre tenue.'); return; }
    const amt = parseInt(form.amount);
    if (!amt || amt < 1000) { setError('Montant invalide.'); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post(`/events/${event.id}/reserve`, {
        description: form.description,
        amount: parseInt(form.amount),
      });
      toast.success(`Réservation ${event.name} créée !`);
      onSuccess?.();
      handleClose();
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

  if (!event) return null;

  return (
    <Modal open={open} onClose={handleClose} title={`${event.icon || '🌟'} ${event.name}`}>
      <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: 'var(--cream)', borderRadius: '4px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--gray)', letterSpacing: '0.1em' }}>
          {event.event_date} · {event.spots_left} place{event.spots_left > 1 ? 's' : ''} restante{event.spots_left > 1 ? 's' : ''} / {event.max_spots}
        </span>
      </div>

      {error && <div className="form-error">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleCalc}>
          <div className="form-group">
            <label className="form-label">Description de votre tenue</label>
            <input className="form-input" type="text"
              placeholder="Ex: Grand boubou cérémonial bazin riche, broderie dorée..."
              value={form.description}
              onChange={e => set('description', e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Montant estimé (FCFA)</label>
            <input className="form-input" type="number" min="1000"
              placeholder="Ex: 50 000"
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
          <div style={{ background: 'var(--cream)', border: '1px solid var(--gray-light)', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-light)' }}>
              <span>Tenue</span><strong>{form.description}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.3rem 0' }}>
              <span>Montant total</span><strong>{parseInt(form.amount).toLocaleString('fr-FR')} FCFA</strong>
            </div>
          </div>

          <div style={{ background: 'var(--bordeaux-deep)', borderRadius: '4px', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(201,168,76,0.3)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.6)', marginBottom: '0.4rem' }}>
              Envoyez la moitié par Wave au
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--gold-light)', letterSpacing: '0.15em' }}>
              78 157 32 91
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', marginTop: '0.4rem' }}>
              {waveAmount.toLocaleString('fr-FR')} FCFA
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Modifier</button>
            <button className="btn-bordeaux" style={{ flex: 2, justifyContent: 'center' }}
              onClick={handleSubmit} disabled={loading}>
              {loading ? 'Envoi...' : '✓ Confirmer'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
