import React from 'react';
import { Eye, Edit, Trash2, MapPin, Check, Users } from 'lucide-react';

const BookCard = ({ book, onSelect, onDelete }) => {
  const getReadingStatusColor = () => {
    const adalyRead = book.readingStatus?.adaly?.read;
    const sebastianRead = book.readingStatus?.sebastian?.read;
    
    if (adalyRead && sebastianRead) return 'border-purple-500 bg-purple-50';
    if (adalyRead) return 'border-green-500 bg-green-50';
    if (sebastianRead) return 'border-blue-500 bg-blue-50';
    return 'border-gray-200';
  };

  const getReadingStatusBadge = () => {
    const adalyRead = book.readingStatus?.adaly?.read;
    const sebastianRead = book.readingStatus?.sebastian?.read;
    
    if (adalyRead && sebastianRead) {
      return <span className="badge badge-purple">Leído por ambos</span>;
    }
    if (adalyRead) {
      return <span className="badge badge-green">Leído por Adaly</span>;
    }
    if (sebastianRead) {
      return <span className="badge badge-blue">Leído por Sebastián</span>;
    }
    return null;
  };

  return (
    <div className={`card card-hover cursor-pointer border-2 transition-all hover:scale-105 ${getReadingStatusColor()}`}>
      <div onClick={onSelect}>
        <div className="flex flex-col h-full">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-40 object-contain rounded-t-lg"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="w-10 h-10 mx-auto mb-1">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                  </svg>
                </div>
                <span className="text-xs">Sin portada</span>
              </div>
            </div>
          )}
          
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
              {book.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
              {book.author}
            </p>
            
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{book.location}</span>
            </div>
            
            {book.categories && book.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {book.categories.slice(0, 1).map(category => (
                  <span key={category._id} className="badge badge-gray text-xs px-2 py-0.5">
                    {category.name}
                  </span>
                ))}
                {book.categories.length > 1 && (
                  <span className="badge badge-gray text-xs px-2 py-0.5">
                    +{book.categories.length - 1}
                  </span>
                )}
              </div>
            )}
            
            <div className="mt-auto">
              {getReadingStatusBadge()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-3 pb-3 flex gap-2">
        <button
          onClick={onSelect}
          className="btn btn-sm btn-outline flex-1 text-xs"
          title="Ver detalles"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="btn btn-sm btn-danger text-xs"
          title="Eliminar libro"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default BookCard;
