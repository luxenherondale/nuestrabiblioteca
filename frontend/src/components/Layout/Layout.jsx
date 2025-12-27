import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BarChart3, Home, Menu, X, User, LogOut, Settings, FileSpreadsheet } from 'lucide-react';
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
      const colorClass = item.color.includes('blue') ? 'blue' : item.color.includes('purple') ? 'purple' : item.color.includes('amber') ? 'amber' : 'emerald';
      
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
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home, color: 'from-blue-500 to-blue-600' },
    { path: '/biblioteca', label: 'Biblioteca', icon: BookOpen, color: 'from-purple-500 to-purple-600' },
    { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3, color: 'from-emerald-500 to-emerald-600' },
    { path: '/importacion', label: 'Importación', icon: FileSpreadsheet, color: 'from-amber-500 to-amber-600' },
  ];

  const handleNavigate = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
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
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="sidebar-avatar-img" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user.username}</span>
                <span className="sidebar-user-role">
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            </div>
            <div className="sidebar-user-actions">
              <Link
                to="/configuracion"
                className="sidebar-user-btn"
                onClick={handleNavigate}
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </Link>
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
    </div>
  );
};

export default Layout;
