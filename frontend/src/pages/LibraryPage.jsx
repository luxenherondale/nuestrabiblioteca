import React, { useState } from 'react';
import { Search, Plus, Filter, X, Eye, Edit, Trash2, BookOpen, MapPin, Tag, Check, XCircle } from 'lucide-react';
import { useLibrary } from '../contexts/LibraryContext.jsx';
import BookCard from '../components/Book/BookCard';
import BookDetailModal from '../components/Book/BookDetailModal';
import AddBookModal from '../components/Book/AddBookModal';
import AddBookManualModal from '../components/Book/AddBookManualModal';
import FilterPanel from '../components/Book/FilterPanel';
import './LibraryPage.css';

const LibraryPage = () => {
  const {
    books,
    categories,
    loading,
    error,
    filters,
    selectedBook,
    showBookDetail,
    setFilters,
    selectBook,
    closeBookDetail,
    clearError,
    deleteBook
  } = useLibrary();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [readingFilter, setReadingFilter] = useState('all');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilters({ search: value });
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      try {
        await deleteBook(bookId);
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const filterByReadingStatus = (bookList) => {
    if (readingFilter === 'all') return bookList;
    
    return bookList.filter(book => {
      const adalyRead = book.readingStatus?.adaly?.read;
      const sebastianRead = book.readingStatus?.sebastian?.read;
      
      switch (readingFilter) {
        case 'adaly':
          return adalyRead && !sebastianRead;
        case 'sebastian':
          return sebastianRead && !adalyRead;
        case 'both':
          return adalyRead && sebastianRead;
        case 'none':
          return !adalyRead && !sebastianRead;
        default:
          return true;
      }
    });
  };

  const filteredBooks = filterByReadingStatus(books);

  const groupedBooks = filteredBooks.reduce((acc, book) => {
    if (book.categories && book.categories.length > 0) {
      const categoryName = book.categories[0].name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(book);
    } else {
      if (!acc['Sin categoría']) {
        acc['Sin categoría'] = [];
      }
      acc['Sin categoría'].push(book);
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Mi Biblioteca
          </h1>
          <p className="text-gray-400 mt-1">
            {books.length} {books.length === 1 ? 'libro' : 'libros'} en tu colección
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center justify-center gap-2 px-6"
            title="Agregar libro por ISBN o búsqueda"
          >
            <Plus className="w-5 h-5" />
            Por API
          </button>
          <button
            onClick={() => setShowAddManualModal(true)}
            className="btn btn-outline flex items-center justify-center gap-2 px-6"
            title="Agregar libro manualmente con todos los campos"
          >
            <Plus className="w-5 h-5" />
            Manual
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-sm hover:text-red-300 underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="library-search-input">
          <Search />
          <input
            type="text"
            placeholder="Buscar por título, autor..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`library-filter-toggle ${showFilters ? 'active' : ''}`}
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>

        {showFilters && (
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              categories={categories}
            />
          </div>
        )}
      </div>

      {/* Reading Status Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setReadingFilter('all')}
          className={`reading-filter-btn ${readingFilter === 'all' ? 'active' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          Todos
        </button>
        <button
          onClick={() => setReadingFilter('adaly')}
          className={`reading-filter-btn ${readingFilter === 'adaly' ? 'active adaly' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          Leído por Adaly
        </button>
        <button
          onClick={() => setReadingFilter('sebastian')}
          className={`reading-filter-btn ${readingFilter === 'sebastian' ? 'active sebastian' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          Leído por Sebastián
        </button>
        <button
          onClick={() => setReadingFilter('both')}
          className={`reading-filter-btn ${readingFilter === 'both' ? 'active both' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
          Leído por ambos
        </button>
        <button
          onClick={() => setReadingFilter('none')}
          className={`reading-filter-btn ${readingFilter === 'none' ? 'active none' : ''}`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-300"></span>
          Sin leer
        </button>
      </div>

      {/* Category Quick Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilters({ category: '' })}
            className={`category-filter-btn ${!filters.category ? 'active' : ''}`}
          >
            Todas las categorías
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setFilters({ category: cat._id })}
              className={`category-filter-btn ${filters.category === cat._id ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Books Grid */}
      {Object.keys(groupedBooks).length === 0 ? (
        <div className="bg-gray-700/30 rounded-lg border border-gray-600 text-center py-16">
          <BookOpen className="w-20 h-20 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No se encontraron libros
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filters.category || filters.location
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer libro usando el botón superior'
            }
          </p>
          {!searchTerm && !filters.category && !filters.location && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Primer Libro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBooks).map(([category, categoryBooks]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {category}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {categoryBooks.length} {categoryBooks.length === 1 ? 'libro' : 'libros'}
                  </p>
                </div>
              </div>
              <div className="library-books-grid">
                {categoryBooks.map(book => (
                  <BookCard
                    key={book._id}
                    book={book}
                    onSelect={() => selectBook(book)}
                    onDelete={() => handleDeleteBook(book._id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookDetail && selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={closeBookDetail}
          onCategoryClick={(categoryId) => {
            setFilters({ category: categoryId });
            closeBookDetail();
          }}
        />
      )}

      <AddBookModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <AddBookManualModal
        isOpen={showAddManualModal}
        onClose={() => setShowAddManualModal(false)}
      />
    </div>
  );
};

export default LibraryPage;
