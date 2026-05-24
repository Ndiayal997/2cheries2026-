import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Déconnecté avec succès');
    setMenuOpen(false);
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          2<em>Cheries</em>
        </Link>

        {/* Desktop */}
        <div className="navbar-links">
          {!isAdmin && (
            <>
              <button className="navbar-link hide-md"
                style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}
                onClick={() => scrollToSection('calendar')}>Calendrier</button>
              <button className="navbar-link hide-md"
                style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}
                onClick={() => scrollToSection('events')}>Événements</button>
              <button className="navbar-link hide-md"
                style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Montserrat,sans-serif' }}
                onClick={() => scrollToSection('how')}>Comment ça marche</button>
            </>
          )}
          {user ? (
            <>
              <span className="navbar-user">👤 {user.name?.split(' ')[0]}</span>
              {isAdmin
                ? <Link to="/admin?tab=orders" className="navbar-link gold">Dashboard ⚙️</Link>
                : <Link to="/mes-commandes" className="navbar-link">Mes commandes</Link>
              }
              <button className="navbar-btn-logout" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <button className="navbar-btn-outline" onClick={() => setShowRegister(true)}>Créer un compte</button>
              <button className="navbar-btn-primary" onClick={() => setShowLogin(true)}>Connexion</button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu" aria-expanded={menuOpen}>
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="navbar-mobile-menu">
            {!isAdmin && (
              <>
                <button className="navbar-mobile-link" onClick={() => scrollToSection('calendar')}>📅 Calendrier</button>
                <button className="navbar-mobile-link" onClick={() => scrollToSection('events')}>🌟 Événements spéciaux</button>
                <button className="navbar-mobile-link" onClick={() => scrollToSection('how')}>❓ Comment ça marche</button>
                <button className="navbar-mobile-link" onClick={() => scrollToSection('wave')}>💳 Paiement Wave</button>
              </>
            )}
            {user ? (
              <>
                <span style={{ padding:'0.8rem 1.5rem', fontSize:'0.72rem', color:'var(--gold)', letterSpacing:'0.1em', display:'block' }}>
                  👤 {user.name}
                </span>
                {isAdmin ? (
                  <>
                    <Link to="/admin?tab=orders" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>📅 Commandes Semaines</Link>
                    <Link to="/admin?tab=events" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>🌟 Événements Spéciaux</Link>
                    <Link to="/admin?tab=clients" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>👥 Gestion Clients</Link>
                  </>
                ) : (
                  <Link to="/mes-commandes" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>📦 Mes commandes</Link>
                )}
                <button className="navbar-mobile-link danger" onClick={handleLogout}>⬅ Déconnexion</button>
              </>
            ) : (
              <>
                <button className="navbar-mobile-link" onClick={() => { setShowRegister(true); setMenuOpen(false); }}>✨ Créer un compte</button>
                <button className="navbar-mobile-cta" onClick={() => { setShowLogin(true); setMenuOpen(false); }}>Connexion</button>
              </>
            )}
          </div>
        )}
      </nav>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />
      <RegisterModal open={showRegister} onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
    </>
  );
}
