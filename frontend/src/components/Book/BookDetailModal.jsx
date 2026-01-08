import React, { useState, useRef } from 'react';
import { X, Edit, Trash2, MapPin, Calendar, BookOpen, Check, XCircle, User, MessageSquare, ExternalLink, Save, Plus, Tag, Star, Lock, Upload, Download } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

const StarRating = ({ rating, onChange, color = 'amber', readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const colorClasses = {
    amber: { filled: '#fbbf24', empty: '#d1d5db' },
    emerald: { filled: '#34d399', empty: '#d1d5db' },
    sky: { filled: '#38bdf8', empty: '#d1d5db' },
    violet: { filled: '#a78bfa', empty: '#d1d5db' }
  };
  
  const colors = colorClasses[color] || colorClasses.amber;
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star === rating ? 0 : star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className="p-0 border-0 bg-transparent cursor-pointer transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
          title={`${star}/10`}
        >
          <Star
            className="w-4 h-4"
            fill={(hoverRating || rating) >= star ? colors.filled : 'none'}
            stroke={(hoverRating || rating) >= star ? colors.filled : colors.empty}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-600">
        {rating > 0 ? `${rating}/10` : ''}
      </span>
    </div>
  );
};

const CategorySelector = ({ selectedCategories, allCategories, onChange }) => {
  const { addCategory, loadCategories } = useLibrary();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsAdding(true);
    try {
      const newCat = await addCategory({ name: newCategoryName.trim() });
      onChange([...selectedCategories, newCat._id]);
      setNewCategoryName('');
      if (loadCategories) loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCategoryNames = allCategories
    .filter(cat => selectedCategories.includes(cat._id))
    .map(cat => cat.name);

  return (
    <div className="space-y-3">
      {/* Lista de checkboxes para selección múltiple */}
      <div className="category-checkbox-list">
        {allCategories.map(cat => (
          <label key={cat._id} className="category-checkbox-item">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat._id)}
              onChange={() => handleToggleCategory(cat._id)}
            />
            <span>{cat.name}</span>
          </label>
        ))}
      </div>
      
      {/* Chips de categorías seleccionadas */}
      {selectedCategoryNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allCategories
            .filter(cat => selectedCategories.includes(cat._id))
            .map(cat => (
              <span
                key={cat._id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium"
              >
                {cat.name}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(cat._id)}
                  className="hover:text-violet-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
      
      {/* Agregar nueva categoría */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nueva categoría..."
          className="py-3 px-4 block flex-1 border-gray-200 rounded-lg text-sm focus:border-violet-500 focus:ring-violet-500 bg-white dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
          onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
        />
        <button
          type="button"
          onClick={handleAddNewCategory}
          disabled={isAdding || !newCategoryName.trim()}
          className="btn btn-sm btn-primary"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const categoryColors = [
  { bg: 'from-rose-200 to-pink-200', text: 'text-rose-700', border: 'border-rose-300' },
  { bg: 'from-violet-200 to-purple-200', text: 'text-violet-700', border: 'border-violet-300' },
  { bg: 'from-sky-200 to-cyan-200', text: 'text-sky-700', border: 'border-sky-300' },
  { bg: 'from-emerald-200 to-teal-200', text: 'text-emerald-700', border: 'border-emerald-300' },
  { bg: 'from-amber-200 to-yellow-200', text: 'text-amber-700', border: 'border-amber-300' },
  { bg: 'from-orange-200 to-red-200', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'from-indigo-200 to-blue-200', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'from-fuchsia-200 to-pink-200', text: 'text-fuchsia-700', border: 'border-fuchsia-300' },
];

const getCategoryColor = (categoryId) => {
  const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return categoryColors[hash % categoryColors.length];
};

const BookDetailModal = ({ book, onClose, onCategoryClick }) => {
  const { updateBook, updateReadingStatus, deleteBook, categories } = useLibrary();
  const { canEditReview, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [downloadingCover, setDownloadingCover] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const coverInputRef = useRef(null);
  const [editForm, setEditForm] = useState({
    location: book.location || 'Biblioteca Principal',
    customLocation: book.customLocation || '',
    categories: book.categories?.map(c => c._id) || [],
    genre: book.genre || '',
    coverImage: book.coverImage || ''
  });
  const [reviewForm, setReviewForm] = useState({
    adaly: {
      read: book.readingStatus?.adaly?.read || false,
      rating: book.readingStatus?.adaly?.rating || 0,
      review: book.readingStatus?.adaly?.review || '',
      reviewDate: book.readingStatus?.adaly?.reviewDate || '',
      goodreadsUrl: book.readingStatus?.adaly?.goodreadsUrl || ''
    },
    sebastian: {
      read: book.readingStatus?.sebastian?.read || false,
      rating: book.readingStatus?.sebastian?.rating || 0,
      review: book.readingStatus?.sebastian?.review || '',
      reviewDate: book.readingStatus?.sebastian?.reviewDate || '',
      goodreadsUrl: book.readingStatus?.sebastian?.goodreadsUrl || ''
    }
  });

  const handleSaveEdit = async () => {
    try {
      await updateBook(book._id, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const handleReadingStatusChange = async (person, read, rating, review, reviewDate, goodreadsUrl) => {
    try {
      await updateReadingStatus(book._id, person, read, rating, review, reviewDate, goodreadsUrl);
      setReviewForm(prev => ({
        ...prev,
        [person]: { read, rating, review, reviewDate, goodreadsUrl }
      }));
    } catch (error) {
      console.error('Error updating reading status:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      try {
        await deleteBook(book._id);
        onClose();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('cover', file);
    
    setUploadingCover(true);
    setCoverMessage('');
    try {
      const response = await axios.post(`${API_URL}/upload/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      setEditForm(prev => ({ ...prev, coverImage: `${API_URL}${response.data.coverUrl}` }));
      setCoverMessage('✓ Portada subida');
    } catch (err) {
      setCoverMessage('Error: ' + (err.response?.data?.message || 'Error al subir'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDownloadCover = async () => {
    if (!editForm.coverImage || !editForm.coverImage.startsWith('http')) return;
    if (editForm.coverImage.startsWith(API_URL)) {
      setCoverMessage('✓ Ya está en el servidor');
      return;
    }
    
    setDownloadingCover(true);
    setCoverMessage('');
    try {
      const response = await axios.post(`${API_URL}/upload/cover-from-url`, 
        { url: editForm.coverImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditForm(prev => ({ ...prev, coverImage: `${API_URL}${response.data.coverUrl}` }));
      setCoverMessage('✓ Portada guardada en servidor');
    } catch (err) {
      setCoverMessage('Error: ' + (err.response?.data?.message || 'Error al descargar'));
    } finally {
      setDownloadingCover(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No leído';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-4xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-violet-800">Detalles del Libro</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-outline"
              title={isEditing ? 'Cancelar edición' : 'Editar libro'}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="btn btn-outline">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {(isEditing ? editForm.coverImage : book.coverImage) ? (
              <img
                src={isEditing ? editForm.coverImage : book.coverImage}
                alt={book.title}
                className="w-full rounded-lg shadow-lg object-contain max-h-[70vh]"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-violet-100 to-pink-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-violet-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-2" />
                  <span>Sin portada</span>
                </div>
              </div>
            )}
            
            {isEditing && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-violet-700 mb-1">
                  Portada
                </label>
                <div className="cover-edit-container">
                  <input
                    type="url"
                    value={editForm.coverImage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, coverImage: e.target.value }))}
                    placeholder="URL o subir archivo..."
                    className="input text-sm cover-url-field"
                  />
                  <div className="cover-edit-buttons">
                    <button
                      type="button"
                      onClick={handleDownloadCover}
                      disabled={downloadingCover || !editForm.coverImage}
                      className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white"
                      title="Guardar en servidor"
                    >
                      {downloadingCover ? '...' : <Download className="w-4 h-4" />}
                    </button>
                    <input
                      type="file"
                      ref={coverInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                      onChange={(e) => e.target.files[0] && handleCoverUpload(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="btn btn-sm bg-violet-500 hover:bg-violet-600 text-white"
                      title="Subir archivo"
                    >
                      {uploadingCover ? '...' : <Upload className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {coverMessage && (
                  <p className={`text-xs mt-1 ${coverMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                    {coverMessage}
                  </p>
                )}
                {editForm.coverImage?.includes('/uploads/') && !coverMessage && (
                  <p className="text-xs text-green-600 mt-1">✓ Guardada en servidor</p>
                )}
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-violet-600">
                <MapPin className="w-4 h-4 text-pink-400" />
                {isEditing ? (
                  <div className="flex-1">
                    <select
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="input w-full text-sm"
                    >
                      <option value="Biblioteca Principal">Biblioteca Principal</option>
                      <option value="Biblioteca Blanca">Biblioteca Blanca</option>
                      <option value="Otro">Otro</option>
                    </select>
                    {editForm.location === 'Otro' && (
                      <input
                        type="text"
                        value={editForm.customLocation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, customLocation: e.target.value }))}
                        placeholder="Especificar ubicación..."
                        className="input w-full text-sm mt-2"
                      />
                    )}
                  </div>
                ) : (
                  <span>{book.location === 'Otro' && book.customLocation ? book.customLocation : book.location}</span>
                )}
              </div>
              
              {book.pageCount && (
                <div className="flex items-center gap-2 text-sm text-violet-600">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>{book.pageCount} páginas</span>
                </div>
              )}
              
              {book.publishDate && (
                <div className="flex items-center gap-2 text-sm text-violet-600">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{new Date(book.publishDate).getFullYear()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-violet-900 mb-2">{book.title}</h3>
              <p className="text-lg text-violet-600 mb-4">{book.author}</p>
              
              {book.description && (
                <div className="mb-4">
                  <h4 className="font-medium text-violet-800 mb-2">Descripción</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <h4 className="font-medium text-violet-800 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-violet-500" />
                  Categorías
                </h4>
                {isEditing ? (
                  <CategorySelector
                    selectedCategories={editForm.categories}
                    allCategories={categories}
                    onChange={(cats) => setEditForm(prev => ({ ...prev, categories: cats }))}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {book.categories && book.categories.length > 0 ? (
                      book.categories.map(cat => {
                        const colors = getCategoryColor(cat._id);
                        return (
                          <button
                            key={cat._id}
                            onClick={() => onCategoryClick && onCategoryClick(cat._id)}
                            className={`inline-flex items-center bg-gradient-to-r ${colors.bg} ${colors.text} px-3 py-1.5 rounded-full text-sm font-medium border-2 ${colors.border} shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer`}
                          >
                            <Tag className="w-3 h-3 mr-1.5" />
                            {cat.name}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-violet-400 text-sm">Sin categorías asignadas</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-emerald-800 flex items-center">
                    <User className="w-4 h-4 mr-2 text-emerald-500" />
                    Adaly
                    {!canEditReview('adaly') && (
                      <Lock className="w-3 h-3 ml-2 text-gray-400" title="Solo Adaly puede editar esta reseña" />
                    )}
                  </h4>
                  <div className="flex items-center gap-2">
                    {canEditReview('adaly') ? (
                      <label 
                        className={`read-status-btn ${reviewForm.adaly.read ? 'read' : 'unread'}`}
                        onClick={() => setReviewForm(prev => ({
                          ...prev,
                          adaly: { ...prev.adaly, read: !prev.adaly.read }
                        }))}
                      >
                        {reviewForm.adaly.read ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Leído</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-5 h-5" />
                            <span>Marcar como leído</span>
                          </>
                        )}
                      </label>
                    ) : (
                      <div className={`read-status-badge ${reviewForm.adaly.read ? 'read' : 'unread'}`}>
                        {reviewForm.adaly.read ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Leído</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>No leído</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-700 mb-1">
                      <Star className="w-4 h-4 inline mr-1 text-amber-400" />
                      Calificación
                    </label>
                    <StarRating
                      rating={reviewForm.adaly.rating}
                      onChange={(value) => setReviewForm(prev => ({
                        ...prev,
                        adaly: { ...prev.adaly, rating: value }
                      }))}
                      color="emerald"
                      readonly={!canEditReview('adaly')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-violet-700 mb-1">
                      Reseña
                    </label>
                    <textarea
                      value={reviewForm.adaly.review}
                      onChange={(e) => setReviewForm(prev => ({
                        ...prev,
                        adaly: { ...prev.adaly, review: e.target.value }
                      }))}
                      placeholder={canEditReview('adaly') ? "Escribe tu reseña..." : ""}
                      className="textarea text-sm"
                      rows={3}
                      disabled={!canEditReview('adaly')}
                    />
                  </div>

                  {reviewForm.adaly.read && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1 text-pink-400" />
                          Fecha de lectura
                        </label>
                        <input
                          type="date"
                          value={reviewForm.adaly.reviewDate ? new Date(reviewForm.adaly.reviewDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setReviewForm(prev => ({
                            ...prev,
                            adaly: { ...prev.adaly, reviewDate: e.target.value ? new Date(e.target.value).toISOString() : '' }
                          }))}
                          className="input w-full text-sm"
                          disabled={!canEditReview('adaly')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          <ExternalLink className="w-4 h-4 inline mr-1 text-sky-400" />
                          URL Goodreads / Blog
                        </label>
                        <input
                          type="url"
                          value={reviewForm.adaly.goodreadsUrl}
                          onChange={(e) => setReviewForm(prev => ({
                            ...prev,
                            adaly: { ...prev.adaly, goodreadsUrl: e.target.value }
                          }))}
                          placeholder={canEditReview('adaly') ? "https://goodreads.com/... o tu blog" : ""}
                          className="input w-full text-sm"
                          disabled={!canEditReview('adaly')}
                        />
                        {reviewForm.adaly.goodreadsUrl && (
                          <a href={reviewForm.adaly.goodreadsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1">
                            Ver reseña <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-sky-800 flex items-center">
                    <User className="w-4 h-4 mr-2 text-sky-500" />
                    Sebastián
                    {!canEditReview('sebastian') && (
                      <Lock className="w-3 h-3 ml-2 text-gray-400" title="Solo Sebastián puede editar esta reseña" />
                    )}
                  </h4>
                  <div className="flex items-center gap-2">
                    {canEditReview('sebastian') ? (
                      <label 
                        className={`read-status-btn sebastian ${reviewForm.sebastian.read ? 'read' : 'unread'}`}
                        onClick={() => setReviewForm(prev => ({
                          ...prev,
                          sebastian: { ...prev.sebastian, read: !prev.sebastian.read }
                        }))}
                      >
                        {reviewForm.sebastian.read ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Leído</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-5 h-5" />
                            <span>Marcar como leído</span>
                          </>
                        )}
                      </label>
                    ) : (
                      <div className={`read-status-badge sebastian ${reviewForm.sebastian.read ? 'read' : 'unread'}`}>
                        {reviewForm.sebastian.read ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Leído</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>No leído</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-700 mb-1">
                      <Star className="w-4 h-4 inline mr-1 text-amber-400" />
                      Calificación
                    </label>
                    <StarRating
                      rating={reviewForm.sebastian.rating}
                      onChange={(value) => setReviewForm(prev => ({
                        ...prev,
                        sebastian: { ...prev.sebastian, rating: value }
                      }))}
                      color="sky"
                      readonly={!canEditReview('sebastian')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-violet-700 mb-1">
                      Reseña
                    </label>
                    <textarea
                      value={reviewForm.sebastian.review}
                      onChange={(e) => setReviewForm(prev => ({
                        ...prev,
                        sebastian: { ...prev.sebastian, review: e.target.value }
                      }))}
                      placeholder={canEditReview('sebastian') ? "Escribe tu reseña..." : ""}
                      className="textarea text-sm"
                      rows={3}
                      disabled={!canEditReview('sebastian')}
                    />
                  </div>

                  {reviewForm.sebastian.read && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1 text-pink-400" />
                          Fecha de lectura
                        </label>
                        <input
                          type="date"
                          value={reviewForm.sebastian.reviewDate ? new Date(reviewForm.sebastian.reviewDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setReviewForm(prev => ({
                            ...prev,
                            sebastian: { ...prev.sebastian, reviewDate: e.target.value ? new Date(e.target.value).toISOString() : '' }
                          }))}
                          className="input w-full text-sm"
                          disabled={!canEditReview('sebastian')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          <ExternalLink className="w-4 h-4 inline mr-1 text-sky-400" />
                          URL Goodreads / Blog
                        </label>
                        <input
                          type="url"
                          value={reviewForm.sebastian.goodreadsUrl}
                          onChange={(e) => setReviewForm(prev => ({
                            ...prev,
                            sebastian: { ...prev.sebastian, goodreadsUrl: e.target.value }
                          }))}
                          placeholder={canEditReview('sebastian') ? "https://goodreads.com/... o tu blog" : ""}
                          className="input w-full text-sm"
                          disabled={!canEditReview('sebastian')}
                        />
                        {reviewForm.sebastian.goodreadsUrl && (
                          <a href={reviewForm.sebastian.goodreadsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1">
                            Ver reseña <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={handleDelete} className="btn btn-danger">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
              <button 
                onClick={async () => {
                  await handleReadingStatusChange(
                    'adaly', 
                    reviewForm.adaly.read,
                    reviewForm.adaly.rating,
                    reviewForm.adaly.review,
                    reviewForm.adaly.reviewDate,
                    reviewForm.adaly.goodreadsUrl
                  );
                  await handleReadingStatusChange(
                    'sebastian', 
                    reviewForm.sebastian.read,
                    reviewForm.sebastian.rating,
                    reviewForm.sebastian.review,
                    reviewForm.sebastian.reviewDate,
                    reviewForm.sebastian.goodreadsUrl
                  );
                  if (isEditing) {
                    await handleSaveEdit();
                  }
                }}
                className="btn btn-primary"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button onClick={onClose} className="btn btn-outline">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;
