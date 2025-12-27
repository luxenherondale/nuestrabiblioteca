import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BarChart3, Plus, Search, Users, TrendingUp, Tag, MapPin } from 'lucide-react';
import { useLibrary } from '../contexts/LibraryContext.jsx';

const HomePage = () => {
  const { books, categories, loading } = useLibrary();

  const totalBooks = books.length;
  const adalyRead = books.filter(book => book.readingStatus?.adaly?.read).length;
  const sebastianRead = books.filter(book => book.readingStatus?.sebastian?.read).length;
  const bothRead = books.filter(book => 
    book.readingStatus?.adaly?.read && book.readingStatus?.sebastian?.read
  ).length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Bienvenidos a Nuestra Biblioteca
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Sistema personalizado para gestionar tu colección de libros,
          con seguimiento de lectura y estadísticas detalladas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Libros</p>
              <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Leídos por Adaly</p>
              <p className="text-2xl font-bold text-green-600">{adalyRead}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Leídos por Sebastián</p>
              <p className="text-2xl font-bold text-purple-600">{sebastianRead}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Leídos por Ambos</p>
              <p className="text-2xl font-bold text-orange-600">{bothRead}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Biblioteca
          </h2>
          <p className="text-gray-600 mb-4">
            Explora tu colección completa de libros. Busca por título, autor, 
            categoría o ubicación. Agrega nuevos libros usando su ISBN.
          </p>
          <div className="flex space-x-4">
            <Link to="/biblioteca" className="btn btn-primary">
              <Search className="w-4 h-4" />
              Explorar Biblioteca
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Estadísticas
          </h2>
          <p className="text-gray-600 mb-4">
            Visualiza tu progreso de lectura con gráficos detallados. 
            Analiza tus hábitos de lectura por mes, categoría y ubicación.
          </p>
          <div className="flex space-x-4">
            <Link to="/estadisticas" className="btn btn-secondary">
              <TrendingUp className="w-4 h-4" />
              Ver Estadísticas
            </Link>
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default HomePage;
