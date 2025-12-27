import React from 'react';
import { X, MapPin, Tag } from 'lucide-react';

const FilterPanel = ({ filters, setFilters, categories }) => {
  const locations = ['Biblioteca Principal', 'Biblioteca Blanca', 'Otro'];
  
  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: ''
    });
  };

  const hasActiveFilters = filters.category || filters.location;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-sm btn-outline"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Categoría
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="select"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Ubicación
          </label>
          <select
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="select"
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.category && (
            <span className="badge badge-blue">
              Categoría: {categories.find(c => c._id === filters.category)?.name || filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-2 text-blue-800 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.location && (
            <span className="badge badge-blue">
              Ubicación: {filters.location}
              <button
                onClick={() => handleFilterChange('location', '')}
                className="ml-2 text-blue-800 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
