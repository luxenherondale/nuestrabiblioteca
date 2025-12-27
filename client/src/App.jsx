import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './contexts/LibraryContext.jsx';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import StatisticsPage from './pages/StatisticsPage';
import './App.css';

function App() {
  return (
    <LibraryProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/biblioteca" element={<LibraryPage />} />
            <Route path="/estadisticas" element={<StatisticsPage />} />
          </Routes>
        </Layout>
      </Router>
    </LibraryProvider>
  );
}

export default App;
