import React, { useState } from 'react';
import EvidenzaCard from './EvidenzaCard';
import './EvidenzaList.css';

function EvidenzaList({ evidenze, token }) {
  const [selectedEvidenza, setSelectedEvidenza] = useState(null);

  const sortedEvidenze = [...evidenze].sort((a, b) => {
    // Ordina per scadenza prossima
    return new Date(a.data_scadenza) - new Date(b.data_scadenza);
  });

  return (
    <div className="evidenza-list">
      {sortedEvidenze.length === 0 ? (
        <div className="no-data">
          <p>📭 Nessuna evidenza trovata</p>
        </div>
      ) : (
        sortedEvidenze.map((evidenza) => (
          <EvidenzaCard
            key={evidenza.id}
            evidenza={evidenza}
            token={token}
            onSelect={() => setSelectedEvidenza(evidenza)}
          />
        ))
      )}
    </div>
  );
}

export default EvidenzaList;
