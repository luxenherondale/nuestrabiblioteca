import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Tag } from 'lucide-react';
import { booksAPI } from '../services/api.jsx';
import BookCard from '../components/Book/BookCard';
import './PublicPage.css';

const PublicPage = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedBooks, setGroupedBooks] = useState({});

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getPublic();
      setBooks(response.data);
      groupBooksByCategory(response.data);
    } catch (err) {
      setError('Error cargando los libros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupBooksByCategory = (booksList) => {
    const grouped = booksList.reduce((acc, book) => {
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
    setGroupedBooks(grouped);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (!value.trim()) {
      groupBooksByCategory(books);
      return;
    }

    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(value) ||
      book.author.toLowerCase().includes(value) ||
      book.isbn.includes(value)
    );

    groupBooksByCategory(filtered);
  };

  if (loading) {
    return (
      <div className="public-page-loading">
        <div className="spinner"></div>
        <p>Cargando biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="public-page">
      {/* Header */}
      <div className="public-header">
        <div className="public-header-content">
          <div className="public-logo">
            <BookOpen className="w-12 h-12 text-purple-500" />
          </div>
          <div>
            <h1 className="public-title">Biblioteca de la Familia Rodrigo Arcia </h1>
            <p className="public-subtitle">
              Buscador directo de todos los libros que tenemos en nuestra biblioteca, para no recibir repetidos. ¡Gracias!
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="public-search-container">
        <div className="public-search-input">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, autor o ISBN..."
            value={searchTerm}
            onChange={handleSearch}
            className="public-search-field"
          />
        </div>
        <p className="public-search-info">
          Total: {books.length} {books.length === 1 ? 'libro' : 'libros'}
        </p>
      </div>

      {error && (
        <div className="public-error">
          <p>{error}</p>
        </div>
      )}

      {/* Books by Category */}
      <div className="public-content">
        {Object.keys(groupedBooks).length === 0 ? (
          <div className="public-empty">
            <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No se encontraron libros' : 'Sin libros disponibles'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Vuelve más tarde para ver nuestra colección'}
            </p>
          </div>
        ) : (
          <div className="public-categories">
            {Object.entries(groupedBooks).map(([category, categoryBooks]) => (
              <div key={category} className="public-category-section">
                <div className="public-category-header">
                  <div className="public-category-icon">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="public-category-title">{category}</h2>
                    <p className="public-category-count">
                      {categoryBooks.length} {categoryBooks.length === 1 ? 'libro' : 'libros'}
                    </p>
                  </div>
                </div>
                <div className="public-books-grid">
                  {categoryBooks.map(book => (
                    <div key={book._id} className="public-book-card">
                      <div className="public-book-image">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="public-book-placeholder">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="public-book-info">
                        <h3 className="public-book-title">{book.title}</h3>
                        <p className="public-book-author">{book.author}</p>
                        {book.isbn && (
                          <p className="public-book-isbn">ISBN: {book.isbn}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="public-footer">
        <p className="text-gray-600 text-sm">
          © 2024 Nuestra Biblioteca - Hecho con ❤️ por Adaly & Sebastián
        </p>
      </div>
    </div>
  );
};

export default PublicPage;
