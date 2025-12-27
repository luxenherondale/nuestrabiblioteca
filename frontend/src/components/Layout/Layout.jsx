import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Home, Menu, X, User, LogOut, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Layout.css';

const SidebarLogo = ({ showText = true }) => (
  <div className="sidebar-logo">
    <Link to="/" className="flex-1">
      <div className="sidebar-logo-icon">
        <BookOpen className="w-6 h-6 text-white" />
      </div>
      {showText && (
        <div className="sidebar-logo-text">
          <p>Nuestra</p>
          <p>Biblioteca</p>
        </div>
      )}
    </Link>
  </div>
);

const SidebarNav = ({ navItems, isActive, sidebarOpen, onNavigate }) => (
  <nav className="sidebar-nav">
    {navItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.path);
      const colorClass = item.color.includes('blue') ? 'blue' : item.color.includes('purple') ? 'purple' : 'emerald';
      
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={`sidebar-nav-link ${active ? `active ${colorClass}` : ''}`}
        >
          <Icon className="sidebar-nav-icon" />
          <span className="sidebar-nav-label">{item.label}</span>
        </Link>
      );
    })}
  </nav>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout, changePassword } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home, color: 'from-blue-500 to-blue-600' },
    { path: '/biblioteca', label: 'Biblioteca', icon: BookOpen, color: 'from-purple-500 to-purple-600' },
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3, color: 'from-emerald-500 to-emerald-600' },
  ];

  const handleNavigate = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordForm.new.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      await changePassword(passwordForm.current, passwordForm.new);
      setPasswordSuccess('Contraseña actualizada correctamente');
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      {/* Responsive Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <SidebarLogo showText={sidebarOpen} />
        <SidebarNav navItems={navItems} isActive={isActive} sidebarOpen={sidebarOpen} onNavigate={handleNavigate} />
        
        {sidebarOpen && user && (
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                <User className="w-5 h-5" />
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user.username}</span>
                <span className="sidebar-user-role">
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            </div>
            <div className="sidebar-user-actions">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="sidebar-user-btn"
                title="Cambiar contraseña"
              >
                <Key className="w-4 h-4" />
                <span>Cambiar contraseña</span>
              </button>
              <button
                onClick={logout}
                className="sidebar-user-btn logout"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="sidebar-footer">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span>Contraer</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <div className="mobile-topbar">
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="mobile-topbar-title">Nuestra Biblioteca</div>
            </div>
            <div className="content-wrapper">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800/80 backdrop-blur-md border-t border-gray-700 py-4 px-6 md:px-8">
          <div className="text-center text-sm text-gray-400">
            © 2024 Nuestra Biblioteca - Hecho con ❤️ por Adaly & Sebastián
          </div>
        </footer>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h3>Cambiar Contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="password-modal-form">
              {passwordError && (
                <div className="password-error">{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className="password-success">{passwordSuccess}</div>
              )}
              <div className="form-group">
                <label>Contraseña actual</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="password-submit-btn">
                Cambiar Contraseña
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
