// src/components/LoginModal.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginModal({ open, onClose, onSwitchToRegister }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Bienvenue, ${user.name.split(' ')[0]} !`);
      onClose();
      if (user.role === 'admin') navigate('/admin');
    } catch (err) {
      setError(err.error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Connexion">
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="votre@email.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => set('password', e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn-bordeaux"
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: 'var(--gray)' }}>
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--bordeaux)', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
          >
            Créer un compte
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--gray)' }}>
          Admin ?{' '}
          <a href="/admin/login" style={{ color: 'var(--bordeaux-pale)', fontWeight: 500 }} onClick={onClose}>
            Accès administrateur
          </a>
        </p>
      </form>
    </Modal>
  );
}
