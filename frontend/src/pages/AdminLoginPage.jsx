// src/pages/AdminLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await adminLogin(form.username, form.password);
      toast.success('Bienvenue, Administrateur');
      navigate('/admin');
    } catch (err) {
      setError(err.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.top}>
          <div style={s.logo}>2<em style={{ fontStyle: 'italic', color: 'var(--bordeaux-pale)' }}>Cheries</em></div>
          <div style={s.subtitle}>Espace Administrateur</div>
        </div>
        <div style={s.body}>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Identifiant</label>
              <input className="form-input" type="text" placeholder="admin"
                value={form.username} onChange={e => set('username', e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <button type="submit" className="btn-bordeaux"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              disabled={loading}>
              {loading ? 'Connexion...' : 'Accéder au dashboard'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <a href="/" style={{ fontSize: '0.75rem', color: 'var(--gray)', textDecoration: 'none' }}>
              ← Retour au site
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bordeaux-deep), var(--bordeaux))',
    padding: '2rem',
  },
  card: {
    background: 'var(--white)', borderRadius: '4px',
    width: '100%', maxWidth: 420,
    overflow: 'hidden', boxShadow: '0 20px 80px rgba(0,0,0,0.3)',
  },
  top: {
    background: 'var(--bordeaux-deep)',
    padding: '2rem', textAlign: 'center',
    borderBottom: '1px solid rgba(201,168,76,0.3)',
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2.5rem', fontWeight: 700, color: 'var(--gold-light)',
  },
  subtitle: {
    fontSize: '0.7rem', letterSpacing: '0.25em',
    textTransform: 'uppercase', color: 'rgba(250,248,245,0.55)',
    marginTop: '0.4rem',
  },
  body: { padding: '2rem' },
};
