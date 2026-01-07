import React, { useState } from 'react';
import { X, Search, Plus, BookOpen, Image, Link, Barcode } from 'lucide-react';
import { booksAPI } from '../../services/api.jsx';
import { useLibrary } from '../../contexts/LibraryContext.jsx';
import Notification from '../Notification';
import BarcodeScanner from './BarcodeScanner';

const AddBookModal = ({ isOpen, onClose }) => {
  const { addBook } = useLibrary();
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('isbn');
  const [previewBook, setPreviewBook] = useState(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  if (!isOpen) return null;

  const handleBarcodeDetected = (barcode) => {
    setIsbn(barcode);
    setShowScanner(false);
    // Buscar automáticamente después de detectar
    setTimeout(() => {
      handleSearchByISBN();
    }, 300);
  };

  const handleSearchByISBN = async () => {
    if (!isbn.trim()) {
      setError('Por favor ingresa un ISBN');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setPreviewBook(null);

    try {
      // Primero buscar información del libro sin agregarlo
      const response = await booksAPI.searchByISBN(isbn.trim());
      const bookData = response.data;
      
      // Si no tiene portada, mostrar preview para agregar URL
      if (!bookData.coverImage) {
        setPreviewBook(bookData);
        setCoverUrl('');
      } else {
        // Si tiene portada, agregar directamente
        await addBook(isbn.trim());
        setSuccess('¡Libro agregado exitosamente!');
        setIsbn('');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      setError(error.message || 'Error al buscar el libro');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdd = async () => {
    setLoading(true);
    setError('');

    try {
      // Agregar libro con la URL de portada personalizada
      await addBook(isbn.trim(), coverUrl.trim() || null);
      setSuccess('¡Libro agregado exitosamente!');
      setIsbn('');
      setPreviewBook(null);
      setCoverUrl('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error al agregar el libro');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewBook(null);
    setCoverUrl('');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    setSearchLoading(true);
    setError('');

    try {
      const response = await booksAPI.searchExternal(searchQuery.trim());
      setSearchResults(response.data);
    } catch (error) {
      setError(error.message || 'Error al buscar libros');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddFromSearch = async (bookData) => {
    if (!bookData.isbn) {
      setError('Este libro no tiene ISBN disponible');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addBook(bookData.isbn);
      setSuccess('¡Libro agregado exitosamente!');
      setSearchQuery('');
      setSearchResults([]);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error al agregar el libro');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (activeTab === 'isbn') {
        if (previewBook) {
          handleConfirmAdd();
        } else {
          handleSearchByISBN();
        }
      } else {
        handleSearch();
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 'min(600px, calc(100% - 2rem))' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Agregar Nuevo Libro</h2>
          <button onClick={onClose} className="btn btn-outline">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('isbn')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'isbn'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Agregar por ISBN
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Buscar y Agregar
          </button>
        </div>

        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError('')}
            duration={4000}
          />
        )}

        {success && (
          <Notification
            type="success"
            message={success}
            onClose={() => setSuccess('')}
            duration={0}
          />
        )}

        {activeTab === 'isbn' ? (
          <div className="space-y-4">
            {!previewBook ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISBN del Libro
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ej: 978-3-16-148410-0"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => setShowScanner(true)}
                      className="btn btn-primary flex items-center gap-2"
                      title="Escanear código de barras con la cámara"
                    >
                      <Barcode className="w-4 h-4" />
                      <span className="hidden sm:inline">Escanear</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Ingresa el ISBN de 10 o 13 dígitos o escanea el código de barras. 
                    Buscamos en Google Books, Open Library e ISBN Chile.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={onClose} className="btn btn-outline">
                    Cancelar
                  </button>
                  <button
                    onClick={handleSearchByISBN}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <div className="spinner w-4 h-4"></div>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Buscar Libro
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="card p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">Libro encontrado</h3>
                  <div className="flex gap-4">
                    <div className="w-24 h-32 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      {(coverUrl || previewBook.coverImage) ? (
                        <img src={coverUrl || previewBook.coverImage} alt="Preview" className="w-full h-full object-cover rounded" onError={(e) => e.target.style.display = 'none'} />
                      ) : (
                        <div className="text-center text-gray-400">
                          <Image className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-xs">Sin portada</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{previewBook.title}</h4>
                      <p className="text-sm text-gray-600">{previewBook.author}</p>
                      {previewBook.publisher && (
                        <p className="text-xs text-gray-500 mt-1">{previewBook.publisher}</p>
                      )}
                      {previewBook.pageCount > 0 && (
                        <p className="text-xs text-gray-500">{previewBook.pageCount} páginas</p>
                      )}
                      {previewBook.source === 'isbnchile' && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          Fuente: ISBN Chile
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Link className="w-4 h-4 inline mr-1" />
                    URL de la portada (opcional)
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="https://ejemplo.com/portada.jpg"
                    className="input"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Puedes agregar una URL de imagen para la portada del libro.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={handleCancelPreview} className="btn btn-outline">
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmAdd}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <div className="spinner w-4 h-4"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Agregar Libro
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Libros
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar por título, autor o palabra clave..."
                  className="input flex-1"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="btn btn-primary"
                >
                  {searchLoading ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Buscar
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-96 overflow-y-auto space-y-3">
                <p className="text-sm text-gray-600">
                  Se encontraron {searchResults.length} libros. Selecciona uno para agregar:
                </p>
                {searchResults.map((book) => (
                  <div key={book.id} className="card p-4">
                    <div className="flex gap-4">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-2">
                          {book.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-1">
                          {book.author}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {book.publisher && `${book.publisher} • `}
                          {book.publishDate && new Date(book.publishDate).getFullYear()}
                        </p>
                        {book.isbn ? (
                          <button
                            onClick={() => handleAddFromSearch(book)}
                            disabled={loading}
                            className="btn btn-sm btn-primary"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">ISBN no disponible</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn btn-outline">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </div>
  );
};

export default AddBookModal;
