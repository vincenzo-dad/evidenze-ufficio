import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = 'https://api.render.com/deploy/srv-d8pvag68bjmc73c6l5h0?key=HlNtkrpU040';


function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      const newSocket = io(API_URL, {
        auth: { token }
      });
      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    if (socket) socket.close();
  };

  return (
    <div className="App">
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard token={token} socket={socket} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
