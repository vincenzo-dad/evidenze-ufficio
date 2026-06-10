import React, { useState } from 'react';
import './EvidenzaCard.css';

function EvidenzaCard({ evidenza, token }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(evidenza);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const getDaysUntilExpire = (dataScadenza) => {
    const today = new Date();
    const expireDate = new Date(dataScadenza);
    const diffTime = expireDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusClass = (days) => {
    if (days < 0) return 'expired';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'warning';
    return 'ok';
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/evidenze/${evidenza.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setIsEditing(false);
        alert('Evidenza aggiornata! ✅');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questa evidenza?')) return;

    try {
      const response = await fetch(`${API_URL}/api/evidenze/${evidenza.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Evidenza eliminata! ✅');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore eliminazione');
    }
  };

  const daysRemaining = getDaysUntilExpire(evidenza.data_scadenza);
  const statusClass = getStatusClass(daysRemaining);

  const getPriorityEmoji = (priorita) => {
    const emojis = { bassa: '🟢', media: '🟡', alta: '🟠', critica: '🔴' };
    return emojis[priorita] || '⚪';
  };

  const getStatusEmoji = (stato) => {
    const emojis = {
      aperta: '📖',
      completata: '✅',
      scaduta: '⏰',
    };
    return emojis[stato] || '📋';
  };

  if (isEditing) {
    return (
      <div className={`evidenza-card editing ${statusClass}`}>
        <div className="edit-form">
          <input
            type="text"
            value={editData.titolo}
            onChange={(e) =>
              setEditData({ ...editData, titolo: e.target.value })
            }
            placeholder="Titolo"
          />
          <textarea
            value={editData.descrizione || ''}
            onChange={(e) =>
              setEditData({ ...editData, descrizione: e.target.value })
            }
            placeholder="Descrizione"
            rows="3"
          />
          <select
            value={editData.stato}
            onChange={(e) =>
              setEditData({ ...editData, stato: e.target.value })
            }
          >
            <option value="aperta">Aperta</option>
            <option value="completata">Completata</option>
            <option value="scaduta">Scaduta</option>
          </select>
          <select
            value={editData.priorita}
            onChange={(e) =>
              setEditData({ ...editData, priorita: e.target.value })
            }
          >
            <option value="bassa">Bassa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Critica</option>
          </select>
          <input
            type="date"
            value={editData.data_scadenza}
            onChange={(e) =>
              setEditData({ ...editData, data_scadenza: e.target.value })
            }
          />
          <div className="edit-buttons">
            <button
              className="save-btn"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
            <button
              className="cancel-btn"
              onClick={() => setIsEditing(false)}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`evidenza-card ${statusClass}`}>
      <div className="card-header">
        <div className="title-section">
          <h3>
            {getStatusEmoji(evidenza.stato)} {evidenza.titolo}
          </h3>
          <span className={`priority ${evidenza.priorita}`}>
            {getPriorityEmoji(evidenza.priorita)} {evidenza.priorita.toUpperCase()}
          </span>
        </div>
        <div className="days-badge">
          {daysRemaining < 0
            ? `Scaduta da ${Math.abs(daysRemaining)} gg`
            : `${daysRemaining} giorni`}
        </div>
      </div>

      <div className="card-body">
        {evidenza.descrizione && (
          <p className="description">{evidenza.descrizione}</p>
        )}
        <div className="meta">
          <span className="category">📂 {evidenza.categoria}</span>
          <span className="date">📅 {new Date(evidenza.data_scadenza).toLocaleDateString('it-IT')}</span>
          <span className="status">
            Status: <strong>{evidenza.stato}</strong>
          </span>
        </div>
      </div>

      <div className="card-actions">
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          ✏️ Modifica
        </button>
        <button className="delete-btn" onClick={handleDelete}>
          🗑️ Elimina
        </button>
      </div>
    </div>
  );
}

export default EvidenzaCard;
