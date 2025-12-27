import React, { useState, useRef } from 'react';
import { X, Save, Plus, Upload, Link, Download } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Notification from '../Notification';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

const AddBookManualModal = ({ isOpen, onClose }) => {
  const { categories, loadBooks } = useLibrary();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publishDate: '',
    description: '',
    pageCount: '',
    language: 'es',
    coverImage: '',
    categories: [],
    location: 'Biblioteca Principal',
    customLocation: '',
    genre: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [coverMode, setCoverMode] = useState('url');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [downloadingCover, setDownloadingCover] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    
    const formDataUpload = new FormData();
    formDataUpload.append('cover', file);
    
    setUploadingCover(true);
    try {
      const response = await axios.post(`${API_URL}/api/upload/cover`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      setFormData(prev => ({ ...prev, coverImage: `${API_URL}${response.data.coverUrl}` }));
      setSuccessMessage('Portada subida correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir la portada');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDownloadCover = async () => {
    if (!formData.coverImage || !formData.coverImage.startsWith('http')) {
      setError('Ingresa una URL válida primero');
      return;
    }
    
    if (formData.coverImage.startsWith(API_URL)) {
      setSuccessMessage('La imagen ya está guardada en el servidor');
      return;
    }
    
    setDownloadingCover(true);
    try {
      const response = await axios.post(`${API_URL}/api/upload/cover-from-url`, 
        { url: formData.coverImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFormData(prev => ({ ...prev, coverImage: `${API_URL}${response.data.coverUrl}` }));
      setSuccessMessage('Portada descargada y guardada en el servidor');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al descargar la portada');
    } finally {
      setDownloadingCover(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleCoverUpload(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (!formData.title.trim() || !formData.author.trim()) {
        setError('El título y autor son requeridos');
        setLoading(false);
        return;
      }

      const bookData = {
        ...formData,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : 0,
        publishDate: formData.publishDate ? new Date(formData.publishDate) : null,
        isbn: formData.isbn || `manual-${Date.now()}`
      };

      const response = await fetch('http://localhost:5000/api/books/add-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar el libro');
      }

      setSuccessMessage('¡Libro agregado exitosamente!');
      setFormData({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publishDate: '',
        description: '',
        pageCount: '',
        language: 'es',
        coverImage: '',
        categories: [],
        location: 'Biblioteca Principal',
        customLocation: '',
        genre: ''
      });

      setTimeout(async () => {
        await loadBooks();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white bg-opacity-95 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Agregar Libro Manualmente</h2>
          <button onClick={onClose} className="btn btn-outline">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage && (
          <Notification
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage('')}
            duration={0}
          />
        )}

        {error && (
          <Notification
            type="error"
            message={error}
            onClose={() => setError(null)}
            duration={4000}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej: Ciudad de Hueso"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Autor *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Ej: Cassandra Clare"
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISBN (Opcional)
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  placeholder="Ej: 978-0-316-76948-0"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Editorial
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  placeholder="Ej: Margaret K. McElderry Books"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Publicación
                </label>
                <input
                  type="date"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Páginas
                </label>
                <input
                  type="number"
                  name="pageCount"
                  value={formData.pageCount}
                  onChange={handleInputChange}
                  placeholder="Ej: 485"
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Descripción y Género */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Detalles</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Escribe una descripción del libro..."
                className="textarea w-full"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Género/Clasificación
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  placeholder="Ej: Fantasía, Romance, Ciencia Ficción"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="fr">Francés</option>
                  <option value="de">Alemán</option>
                  <option value="pt">Portugués</option>
                </select>
              </div>
            </div>
          </div>

          {/* Portada */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Portada</h3>
            
            <div className="cover-mode-toggle">
              <button
                type="button"
                className={`cover-mode-btn ${coverMode === 'url' ? 'active' : ''}`}
                onClick={() => setCoverMode('url')}
              >
                <Link className="w-4 h-4" />
                URL
              </button>
              <button
                type="button"
                className={`cover-mode-btn ${coverMode === 'upload' ? 'active' : ''}`}
                onClick={() => setCoverMode('upload')}
              >
                <Upload className="w-4 h-4" />
                Subir archivo
              </button>
            </div>

            {coverMode === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la Portada
                </label>
                <div className="cover-url-input">
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/portada.jpg"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleDownloadCover}
                    disabled={downloadingCover || !formData.coverImage}
                    className="btn-download-cover"
                    title="Descargar y guardar en servidor"
                  >
                    {downloadingCover ? (
                      <span className="loading-spinner-small"></span>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Haz clic en el botón de descarga para guardar la imagen en el servidor y evitar links caídos
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subir imagen de portada
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div 
                  className="cover-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingCover ? (
                    <div className="upload-loading">
                      <span className="loading-spinner-small"></span>
                      <span>Subiendo...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-purple-500" />
                      <span className="text-gray-600">Haz clic para seleccionar una imagen</span>
                      <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP o AVIF. Máximo 5MB</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {formData.coverImage && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  Vista previa:
                  {formData.coverImage.includes('/uploads/') && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      ✓ Guardada en servidor
                    </span>
                  )}
                </p>
                <img
                  src={formData.coverImage}
                  alt="Vista previa"
                  className="h-32 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%23e5e7eb" width="100" height="150"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
          </div>

          {/* Categorías */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(category => (
                <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category._id)}
                    onChange={() => handleCategoryToggle(category._id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación Predeterminada
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  <option value="Biblioteca Principal">Biblioteca Principal</option>
                  <option value="Biblioteca Blanca">Biblioteca Blanca</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {formData.location === 'Otro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especificar Ubicación
                  </label>
                  <input
                    type="text"
                    name="customLocation"
                    value={formData.customLocation}
                    onChange={handleInputChange}
                    placeholder="Ej: Estante 3, Piso 2"
                    className="input w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white bg-opacity-95">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Libro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookManualModal;
