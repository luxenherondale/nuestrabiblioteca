import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useLibrary } from '../contexts/LibraryContext.jsx';
import BookCard from '../components/Book/BookCard';
import BookDetailModal from '../components/Book/BookDetailModal';
import './CategoryPage.css';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    books,
    selectedBook,
    showBookDetail,
    selectBook,
    closeBookDetail,
    deleteBook
  } = useLibrary();

  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [categoryBooks, setCategoryBooks] = useState([]);

  useEffect(() => {
    if (location.state?.categoryBooks) {
      setCategoryBooks(location.state.categoryBooks);
    } else {
      const decodedCategory = decodeURIComponent(categoryName);
      const filtered = books.filter(book => {
        if (decodedCategory === 'Sin categoría') {
          return !book.categories || book.categories.length === 0;
        }
        return book.categories?.some(cat => cat.name === decodedCategory);
      });
      setCategoryBooks(filtered);
    }
    setCurrentPage(1);
  }, [categoryName, books, location.state]);

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      try {
        await deleteBook(bookId);
        const updated = categoryBooks.filter(b => b._id !== bookId);
        setCategoryBooks(updated);
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const totalPages = Math.ceil(categoryBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const displayedBooks = categoryBooks.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const decodedCategory = decodeURIComponent(categoryName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/biblioteca')}
          className="btn btn-outline flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {decodedCategory}
            </h1>
            <p className="text-gray-400 mt-1">
              {categoryBooks.length} {categoryBooks.length === 1 ? 'libro' : 'libros'}
            </p>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-700/30 rounded-lg p-4 border border-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Libros por página:</span>
          <select
            value={booksPerPage}
            onChange={(e) => {
              setBooksPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:border-purple-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-400 px-4">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {displayedBooks.length === 0 ? (
        <div className="bg-gray-700/30 rounded-lg border border-gray-600 text-center py-16">
          <p className="text-gray-400">No hay libros en esta categoría</p>
        </div>
      ) : (
        <div className="category-books-grid">
          {displayedBooks.map(book => (
            <BookCard
              key={book._id}
              book={book}
              onSelect={() => selectBook(book)}
              onDelete={() => handleDeleteBook(book._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      <div className="text-center text-sm text-gray-400">
        Mostrando {startIndex + 1} a {Math.min(endIndex, categoryBooks.length)} de {categoryBooks.length} libros
      </div>

      {showBookDetail && selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={closeBookDetail}
        />
      )}
    </div>
  );
};

export default CategoryPage;
