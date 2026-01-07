import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { LibraryProvider } from './contexts/LibraryContext.jsx';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import StatisticsPage from './pages/StatisticsPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ImportPage from './pages/ImportPage';
import PublicPage from './pages/PublicPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/biblioteca-publica" element={<PublicPage />} />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <LibraryProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/biblioteca" element={<LibraryPage />} />
                  <Route path="/categoria/:categoryName" element={<CategoryPage />} />
                  <Route path="/categorias" element={<CategoriesPage />} />
                  <Route path="/estadisticas" element={<StatisticsPage />} />
                  <Route path="/importacion" element={<ImportPage />} />
                  <Route path="/configuracion" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </LibraryProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
