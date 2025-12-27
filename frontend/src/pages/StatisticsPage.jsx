import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, BookOpen, Calendar, Filter } from 'lucide-react';
import { statsAPI } from '../services/api.jsx';

const StatisticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [selectedYear]);

  const loadStatistics = async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewRes, monthlyRes, categoryRes, locationRes] = await Promise.all([
        statsAPI.getOverview(),
        statsAPI.getReadingByMonth(selectedYear),
        statsAPI.getByCategory(),
        statsAPI.getByLocation()
      ]);

      setOverview(overviewRes.data);
      setMonthlyData(monthlyRes.data);
      setCategoryData(categoryRes.data);
      setLocationData(locationRes.data);
    } catch (error) {
      setError('Error al cargar las estadísticas');
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
      </div>
    );
  }

  if (!overview || !monthlyData || !categoryData || !locationData) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  const categoryChartData = Object.entries(categoryData).map(([name, stats]) => ({
    name,
    total: stats.total,
    adalyRead: stats.adalyRead,
    sebastianRead: stats.sebastianRead,
    bothRead: stats.bothRead
  }));

  const locationChartData = locationData.map(location => ({
    name: location._id,
    total: location.total,
    adalyRead: location.adalyRead,
    sebastianRead: location.sebastianRead
  }));

  const pieChartData = [
    { name: 'Leídos por Adaly', value: overview.adalyRead, color: '#10b981' },
    { name: 'Leídos por Sebastián', value: overview.sebastianRead, color: '#3b82f6' },
    { name: 'Leídos por ambos', value: overview.bothRead, color: '#8b5cf6' },
    { name: 'No leídos', value: overview.totalBooks - overview.adalyRead - overview.sebastianRead + overview.bothRead, color: '#e5e7eb' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Estadísticas
          </h1>
          <p className="text-gray-400 mt-1">Análisis de tu progreso de lectura</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3 border border-gray-600">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year} className="bg-gray-800">{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Libros</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalBooks}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Leídos por Adaly</p>
              <p className="text-2xl font-bold text-green-600">{overview.adalyRead}</p>
              <p className="text-xs text-gray-500">
                {overview.totalBooks > 0 ? Math.round((overview.adalyRead / overview.totalBooks) * 100) : 0}% del total
              </p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Leídos por Sebastián</p>
              <p className="text-2xl font-bold text-blue-600">{overview.sebastianRead}</p>
              <p className="text-xs text-gray-500">
                {overview.totalBooks > 0 ? Math.round((overview.sebastianRead / overview.totalBooks) * 100) : 0}% del total
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Leídos por Ambos</p>
              <p className="text-2xl font-bold text-purple-600">{overview.bothRead}</p>
              <p className="text-xs text-gray-500">
                {overview.totalBooks > 0 ? Math.round((overview.bothRead / overview.totalBooks) * 100) : 0}% del total
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lectura Mensual - {selectedYear}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData.months.map((month, index) => ({
              month,
              adaly: monthlyData.adalyData[index],
              sebastian: monthlyData.sebastianData[index]
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="adaly" stroke="#10b981" name="Adaly" strokeWidth={2} />
              <Line type="monotone" dataKey="sebastian" stroke="#3b82f6" name="Sebastián" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Lectura</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Libros por Categoría</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={categoryChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#e5e7eb" name="Total" />
            <Bar dataKey="adalyRead" fill="#10b981" name="Leídos por Adaly" />
            <Bar dataKey="sebastianRead" fill="#3b82f6" name="Leídos por Sebastián" />
            <Bar dataKey="bothRead" fill="#8b5cf6" name="Leídos por Ambos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Libros por Ubicación</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#e5e7eb" name="Total" />
            <Bar dataKey="adalyRead" fill="#10b981" name="Leídos por Adaly" />
            <Bar dataKey="sebastianRead" fill="#3b82f6" name="Leídos por Sebastián" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsPage;
