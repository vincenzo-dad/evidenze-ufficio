import React, { useEffect, useState } from 'react';
import EvidenzaForm from './EvidenzaForm';
import EvidenzaList from './EvidenzaList';
import './Dashboard.css';

function Dashboard({ token, socket, onLogout }) {
  const [evidenze, setEvidenze] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('aperta');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchEvidenze();

    if (socket) {
      socket.on('nuova_evidenza', (nuovaEvidenza) => {
        setEvidenze((prev) => [nuovaEvidenza, ...prev]);
      });

      socket.on('evidenza_aggiornata', (evidenzaAggiornata) => {
        setEvidenze((prev) =>
          prev.map((e) => (e.id === evidenzaAggiornata.id ? evidenzaAggiornata : e))
        );
      });

      socket.on('evidenza_eliminata', (data) => {
        setEvidenze((prev) => prev.filter((e) => e.id !== data.id));
      });

      return () => {
        socket.off('nuova_evidenza');
        socket.off('evidenza_aggiornata');
        socket.off('evidenza_eliminata');
      };
    }
  }, [socket]);

  const fetchEvidenze = async () => {
    try {
      const response = await fetch(`${API_URL}/api/evidenze`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvidenze(data);
      }
    } catch (error) {
      console.error('Errore caricamento evidenze:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvidenze = evidenze.filter((e) => {
    if (filter === 'all') return true;
    return e.stato === filter;
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📋 Gestione Evidenze</h1>
        <button className="logout-btn" onClick={onLogout}>
          Esci
        </button>
      </header>

      <div className="dashboard-content">
        <div className="form-section">
          <EvidenzaForm token={token} />
        </div>

        <div className="list-section">
          <div className="filter-bar">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Tutte ({evidenze.length})
            </button>
            <button
              className={filter === 'aperta' ? 'active' : ''}
              onClick={() => setFilter('aperta')}
            >
              Aperte ({evidenze.filter((e) => e.stato === 'aperta').length})
            </button>
            <button
              className={filter === 'completata' ? 'active' : ''}
              onClick={() => setFilter('completata')}
            >
              Completate ({evidenze.filter((e) => e.stato === 'completata').length})
            </button>
            <button
              className={filter === 'scaduta' ? 'active' : ''}
              onClick={() => setFilter('scaduta')}
            >
              Scadute ({evidenze.filter((e) => e.stato === 'scaduta').length})
            </button>
          </div>

          {loading ? (
            <div className="loading">Caricamento evidenze...</div>
          ) : (
            <EvidenzaList evidenze={filteredEvidenze} token={token} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
