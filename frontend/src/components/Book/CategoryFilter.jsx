import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { booksAPI } from '../../services/api';

const CategoryFilter = ({ selectedCategories, onCategoriesChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await booksAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (categoryId) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoriesChange(newSelected);
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
  };

  const selectedCategoryNames = categories
    .filter(cat => selectedCategories.includes(cat._id))
    .map(cat => cat.name);

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando categorías...</div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
      >
        <span className="text-sm">
          {selectedCategories.length === 0
            ? 'Filtrar por categoría'
            : `${selectedCategories.length} categoría${selectedCategories.length !== 1 ? 's' : ''} seleccionada${selectedCategories.length !== 1 ? 's' : ''}`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <div className="max-h-64 overflow-y-auto">
            {categories.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                No hay categorías disponibles
              </div>
            ) : (
              <div className="space-y-0">
                {categories.map(category => (
                  <label
                    key={category._id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleToggleCategory(category._id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="border-t border-gray-200 p-2 flex gap-2">
              <button
                onClick={handleClearAll}
                className="flex-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}

      {selectedCategoryNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCategoryNames.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
