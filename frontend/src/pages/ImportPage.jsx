import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download, Image, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import './ImportPage.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ImportPage = () => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [location, setLocation] = useState('Biblioteca Principal');
  const [expandedSections, setExpandedSections] = useState({
    toImport: true,
    notFound: true,
    alreadyExists: true,
    pendingImage: true
  });
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setImportResult(null);
      setSelectedBooks([]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setPreviewData(null);
      setImportResult(null);
      setSelectedBooks([]);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/import/preview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setPreviewData(response.data);
      setSelectedBooks(response.data.toImport.map((_, index) => index));
    } catch (error) {
      alert(error.response?.data?.message || 'Error procesando archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || selectedBooks.length === 0) return;

    setLoading(true);
    const booksToImport = selectedBooks.map(index => previewData.toImport[index]);

    try {
      const response = await axios.post(`${API_URL}/import/confirm`, {
        books: booksToImport,
        location
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setImportResult(response.data);
      setPreviewData(null);
      setFile(null);
      setSelectedBooks([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Error importando libros');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/import/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'biblioteca_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exportando libros');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookSelection = (index) => {
    setSelectedBooks(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleAllBooks = () => {
    if (selectedBooks.length === previewData?.toImport.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(previewData.toImport.map((_, index) => index));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const resetImport = () => {
    setLoading(false);
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setSelectedBooks([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-page">
      <div className="import-header">
        <h1>
          <FileSpreadsheet className="header-icon" />
          Importación de Libros
        </h1>
        <p>Importa tu colección desde un archivo Excel o exporta tu biblioteca actual</p>
      </div>

      <div className="import-actions-bar">
        <button className="export-btn" onClick={handleExport} disabled={loading}>
          <Download className="btn-icon" />
          Exportar Biblioteca
        </button>
      </div>

      {!previewData && !importResult && (
        <div className="upload-section">
          <div 
            className={`upload-zone ${file ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {file ? (
              <div className="file-selected">
                <FileSpreadsheet className="file-icon" />
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <Upload className="upload-icon" />
                <p className="upload-text">Arrastra tu archivo Excel aquí</p>
                <p className="upload-subtext">o haz clic para seleccionar</p>
                <p className="upload-formats">Formatos: .xlsx, .xls</p>
              </>
            )}
          </div>

          {file && (
            <div className="upload-options">
              <div className="location-select">
                <label>Ubicación para los libros importados:</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)}>
                  <option value="Biblioteca Principal">Biblioteca Principal</option>
                  <option value="Biblioteca Blanca">Biblioteca Blanca</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="upload-buttons">
                <button className="cancel-btn" onClick={resetImport}>
                  Cancelar
                </button>
                <button className="preview-btn" onClick={handlePreview} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="btn-icon spinning" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="btn-icon" />
                      Previsualizar Importación
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="format-info">
            <h3>Formato esperado del Excel:</h3>
            <table className="format-table">
              <thead>
                <tr>
                  <th>TITULO DEL LIBRO</th>
                  <th>AUTOR</th>
                  <th>LEIDO POR SEBASTIAN</th>
                  <th>LEIDO POR ADALY</th>
                  <th>SIN TERMINAR POR SEBASTIAN</th>
                  <th>SIN TERMINAR POR ADALY</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cien años de soledad</td>
                  <td>Gabriel García Márquez</td>
                  <td>Sí</td>
                  <td>Sí</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewData && !importResult && (
        <div className="preview-section">
          <div className="preview-summary">
            <div className="summary-card success">
              <CheckCircle className="summary-icon" />
              <div className="summary-content">
                <span className="summary-number">{previewData.toImport.length}</span>
                <span className="summary-label">Listos para importar</span>
              </div>
            </div>
            <div className="summary-card warning">
              <Image className="summary-icon" />
              <div className="summary-content">
                <span className="summary-number">{previewData.pendingImage.length}</span>
                <span className="summary-label">Sin portada</span>
              </div>
            </div>
            <div className="summary-card error">
              <XCircle className="summary-icon" />
              <div className="summary-content">
                <span className="summary-number">{previewData.notFound.length}</span>
                <span className="summary-label">No encontrados</span>
              </div>
            </div>
            <div className="summary-card info">
              <AlertCircle className="summary-icon" />
              <div className="summary-content">
                <span className="summary-number">{previewData.alreadyExists.length}</span>
                <span className="summary-label">Ya existen</span>
              </div>
            </div>
          </div>

          {previewData.toImport.length > 0 && (
            <div className="preview-list">
              <div 
                className="list-header success"
                onClick={() => toggleSection('toImport')}
              >
                <div className="header-left">
                  <CheckCircle className="list-icon" />
                  <h3>Libros a importar ({previewData.toImport.length})</h3>
                </div>
                <div className="header-right">
                  <label className="select-all" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedBooks.length === previewData.toImport.length}
                      onChange={toggleAllBooks}
                    />
                    Seleccionar todos
                  </label>
                  {expandedSections.toImport ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
              
              {expandedSections.toImport && (
                <div className="list-content">
                  {previewData.toImport.map((item, index) => (
                    <div 
                      key={index} 
                      className={`book-item ${selectedBooks.includes(index) ? 'selected' : ''}`}
                      onClick={() => toggleBookSelection(index)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBooks.includes(index)}
                        onChange={() => {}}
                      />
                      <div className="book-cover-mini">
                        {item.bookData.coverImage ? (
                          <img src={item.bookData.coverImage} alt="" />
                        ) : (
                          <div className="no-cover">
                            <Image />
                          </div>
                        )}
                      </div>
                      <div className="book-info">
                        <span className="book-title">{item.bookData.title}</span>
                        <span className="book-author">{item.bookData.author}</span>
                        <span className="book-original">
                          Original: "{item.originalTitle}" - {item.originalAuthor}
                        </span>
                      </div>
                      <div className="book-status">
                        {item.bookData.readingStatus?.sebastian?.read && (
                          <span className="status-badge sebastian">Sebastián ✓</span>
                        )}
                        {item.bookData.readingStatus?.adaly?.read && (
                          <span className="status-badge adaly">Adaly ✓</span>
                        )}
                        {!item.hasImage && (
                          <span className="status-badge no-image">Sin portada</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {previewData.notFound.length > 0 && (
            <div className="preview-list">
              <div 
                className="list-header error"
                onClick={() => toggleSection('notFound')}
              >
                <div className="header-left">
                  <XCircle className="list-icon" />
                  <h3>No encontrados ({previewData.notFound.length})</h3>
                </div>
                {expandedSections.notFound ? <ChevronUp /> : <ChevronDown />}
              </div>
              
              {expandedSections.notFound && (
                <div className="list-content">
                  {previewData.notFound.map((item, index) => (
                    <div key={index} className="book-item not-found">
                      <div className="book-info">
                        <span className="book-title">{item.title}</span>
                        <span className="book-author">{item.author}</span>
                        <span className="book-reason">{item.reason}</span>
                      </div>
                      <span className="row-number">Fila {item.row}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {previewData.alreadyExists.length > 0 && (
            <div className="preview-list">
              <div 
                className="list-header info"
                onClick={() => toggleSection('alreadyExists')}
              >
                <div className="header-left">
                  <AlertCircle className="list-icon" />
                  <h3>Ya existen en biblioteca ({previewData.alreadyExists.length})</h3>
                </div>
                {expandedSections.alreadyExists ? <ChevronUp /> : <ChevronDown />}
              </div>
              
              {expandedSections.alreadyExists && (
                <div className="list-content">
                  {previewData.alreadyExists.map((item, index) => (
                    <div key={index} className="book-item exists">
                      <div className="book-info">
                        <span className="book-title">{item.title}</span>
                        <span className="book-author">{item.author}</span>
                        <span className="book-existing">
                          Existente: "{item.existingTitle}" - {item.existingAuthor}
                        </span>
                      </div>
                      <span className="row-number">Fila {item.row}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="preview-actions">
            <button className="cancel-btn" onClick={resetImport}>
              Cancelar
            </button>
            <button 
              className="confirm-btn" 
              onClick={handleConfirmImport}
              disabled={loading || selectedBooks.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="btn-icon spinning" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle className="btn-icon" />
                  Importar {selectedBooks.length} libro{selectedBooks.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="result-section">
          <div className="result-header">
            <CheckCircle className="result-icon success" />
            <h2>Importación Completada</h2>
          </div>

          <div className="result-summary">
            <div className="result-stat success">
              <span className="stat-number">{importResult.imported.length}</span>
              <span className="stat-label">Libros importados</span>
            </div>
            {importResult.failed.length > 0 && (
              <div className="result-stat error">
                <span className="stat-number">{importResult.failed.length}</span>
                <span className="stat-label">Fallidos</span>
              </div>
            )}
          </div>

          {importResult.imported.length > 0 && (
            <div className="result-list">
              <h3>Libros importados:</h3>
              <ul>
                {importResult.imported.map((book, index) => (
                  <li key={index} className={book.hasImage ? '' : 'no-image'}>
                    <CheckCircle className="item-icon" />
                    <span>{book.title}</span>
                    {!book.hasImage && <span className="pending-tag">Pendiente de portada</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {importResult.failed.length > 0 && (
            <div className="result-list failed">
              <h3>Fallidos:</h3>
              <ul>
                {importResult.failed.map((book, index) => (
                  <li key={index}>
                    <XCircle className="item-icon" />
                    <span>{book.title}: {book.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="new-import-btn" onClick={resetImport}>
            <Upload className="btn-icon" />
            Nueva Importación
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
