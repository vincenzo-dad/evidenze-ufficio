import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

const API_URL = 'https://evidenze-ufficio-backend.onrender.com';  postgresql://evidenze_db_user:kULOWOpqvROFKSf4OkjQY3PfDZBaCJWF@dpg-d8pv4qbeo5us73aivfbg-a/evidenze_db

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) {
      const newSocket = io(SOCKET_URL, {
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
