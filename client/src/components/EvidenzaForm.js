import React, { useState } from 'react';
import './EvidenzaForm.css';

function EvidenzaForm({ token }) {
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    categoria: 'lavoro',
    priorita: 'media',
    data_scadenza: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    if (!formData.titolo || !formData.data_scadenza) {
      alert('Titolo e data scadenza sono obbligatori');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/evidenze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Evidenza creata con successo! ✅');
        setFormData({
          titolo: '',
          descrizione: '',
          categoria: 'lavoro',
          priorita: 'media',
          data_scadenza: '',
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert('Errore nella creazione');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evidenza-form">
      <h2>➕ Nuova Evidenza</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="titolo"
          placeholder="Titolo *"
          value={formData.titolo}
          onChange={handleChange}
          required
        />

        <textarea
          name="descrizione"
          placeholder="Descrizione..."
          value={formData.descrizione}
          onChange={handleChange}
          rows="4"
        />

        <select
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
        >
          <option value="lavoro">Lavoro</option>
          <option value="urgente">Urgente</option>
          <option value="riunione">Riunione</option>
          <option value="altro">Altro</option>
        </select>

        <select
          name="priorita"
          value={formData.priorita}
          onChange={handleChange}
        >
          <option value="bassa">Bassa</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Critica</option>
        </select>

        <input
          type="date"
          name="data_scadenza"
          value={formData.data_scadenza}
          onChange={handleChange}
          required
        />

        {success && <div className="success">{success}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creazione...' : 'Crea Evidenza'}
        </button>
      </form>
    </div>
  );
}

export default EvidenzaForm;
