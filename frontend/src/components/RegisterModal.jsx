// src/components/RegisterModal.jsx
import { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterModal({ open, onClose, onSwitchToLogin }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.name || !form.phone || !form.password) {
      setError('Tous les champs sont obligatoires.'); return;
    }
    if (form.password.length < 6) { setError('Mot de passe : 6 caractères minimum.'); return; }
    setLoading(true);
    try {
      const user = await register(form.name, null, form.phone, form.password);
      toast.success(`Bienvenue, ${user.name.split(' ')[0]} ! Compte créé.`);
      onClose();
    } catch (err) {
      setError(err.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Créer un compte">
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Prénom</label>
          <input className="form-input" type="text" placeholder="Votre prénom"
            value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input className="form-input" type="tel" placeholder="77 XXX XX XX"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input className="form-input" type="password" placeholder="6 caractères minimum"
            value={form.password} onChange={e => set('password', e.target.value)} />
        </div>

        <button
          type="submit"
          className="btn-bordeaux"
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: 'var(--gray)' }}>
          Déjà un compte ?{' '}
          <button type="button" onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--bordeaux)', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>
            Se connecter
          </button>
        </p>
      </form>
    </Modal>
  );
}
