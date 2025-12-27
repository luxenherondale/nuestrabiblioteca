import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <BookOpen className="w-12 h-12 text-violet-500" />
          </div>
          <h1 className="login-title">Nuestra Biblioteca</h1>
          <p className="login-subtitle">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {(localError || error) && (
            <div className="login-error">
              <AlertCircle className="w-4 h-4" />
              <span>{localError || error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <Mail className="w-4 h-4" />
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock className="w-4 h-4" />
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Biblioteca compartida de Adaly y Sebastián</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
