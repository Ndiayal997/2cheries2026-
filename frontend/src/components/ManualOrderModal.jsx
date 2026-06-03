import { useState } from 'react';
import Modal from './Modal';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ManualOrderModal({ open, onClose, weeks, events, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    description: '',
    amount: '',
    week_id: '',
    event_id: '',
    order_date: new Date().toISOString().split('T')[0]
  });
  const [photos, setPhotos] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.client_phone || !form.description || (!form.week_id && !form.event_id)) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    photos.forEach(file => formData.append('photos', file));

    try {
      await api.post('/admin/orders/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Commande ajoutée');
      onSuccess();
      onClose();
      setForm({
        client_name: '',
        client_phone: '',
        description: '',
        amount: '',
        week_id: '',
        event_id: '',
        order_date: new Date().toISOString().split('T')[0]
      });
      setPhotos([]);
    } catch (err) {
      toast.error(err.error || 'Erreur lors de l’ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une commande manuelle">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          <div className="form-group">
            <label className="form-label">Nom client *</label>
            <input className="form-input" type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Prénom Nom" />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone *</label>
            <input className="form-input" type="text" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} placeholder="77..." />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description (Commande) *</label>
          <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Détails de l'article..." rows={2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          <div className="form-group">
            <label className="form-label">Montant (FCFA)</label>
            <input className="form-input" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="15000" />
          </div>
          <div className="form-group">
            <label className="form-label">Date de commande</label>
            <input className="form-input" type="date" value={form.order_date} onChange={e => set('order_date', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Lier à : *</label>
          <select className="form-input" value={form.week_id || form.event_id || ''} onChange={e => {
            const val = e.target.value;
            if (val.startsWith('w')) {
              set('week_id', val);
              set('event_id', '');
            } else {
              set('event_id', val);
              set('week_id', '');
            }
          }}>
            <option value="">-- Sélectionner une semaine ou un événement --</option>
            <optgroup label="Semaines">
              {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </optgroup>
            <optgroup label="Événements">
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Photos des articles (max 5)</label>
          <input className="form-input" type="file" multiple accept="image/*" onChange={e => setPhotos(Array.from(e.target.files))} />
          {photos.length > 0 && <p style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: '0.3rem' }}>{photos.length} fichiers sélectionnés</p>}
        </div>

        <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Ajout en cours...' : 'Enregistrer la commande'}
        </button>
      </form>
    </Modal>
  );
}
