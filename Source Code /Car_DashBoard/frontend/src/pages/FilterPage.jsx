import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, ChartCard, LoadingSpinner, Pagination, FilterSelect, FilterInput } from '../components/common';
import { API_BASE_URL } from '../constants';
import { COLORS } from '../constants';
import CarDetailModal from './CarDetailPage';

// ===== FILTER PAGE  =====
const FilterPage = () => {
  const [filterOptions, setFilterOptions] = useState({ manufacturers: [], fuelTypes: [], years: [] });
  const [models, setModels] = useState([]);
  const [filters, setFilters] = useState({ 
    manufacturer: '', 
    model: '',
    car_id: '',
    fuel_type: '', 
    min_year: '', 
    max_year: '', 
    min_price: '', 
    max_price: '' 
  });
  const [cars, setCars] = useState([]);
  const [modelDist, setModelDist] = useState([]);
  const [salesDist, setSalesDist] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCars, setTotalCars] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.manufacturer) {
      fetchModels();
    } else {
      setModels([]);
      setFilters(prev => ({ ...prev, model: '' }));
    }
  }, [filters.manufacturer]);

  useEffect(() => {
    fetchCars();
    fetchDistributions();
  }, [filters, currentPage]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/filter-options`);
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/models?manufacturer=${filters.manufacturer}`);
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ ...filters, page: currentPage, limit: 10 });
      const response = await fetch(`${API_BASE_URL}/cars?${queryParams}`);
      const data = await response.json();
      setCars(data.cars);
      setTotalPages(data.totalPages);
      setTotalCars(data.total);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributions = async () => {
    try {
      const mfr = filters.manufacturer || '';
      const [modelRes, salesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cars/analytics/model-distribution?manufacturer=${mfr}`),
        fetch(`${API_BASE_URL}/cars/analytics/sales-distribution?manufacturer=${mfr}`)
      ]);
      
      const modelData = await modelRes.json();
      const salesData = await salesRes.json();
      
      setModelDist(modelData);
      setSalesDist(salesData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ manufacturer: '', model: '', car_id: '', fuel_type: '', min_year: '', max_year: '', min_price: '', max_price: '' });
    setCurrentPage(1);
  };

  const handleRowClick = (car) => {
    setSelectedCar(car);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Filter & Search Cars" subtitle="Search and filter cars with advanced criteria" />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800"> Search Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FilterInput label="Car ID" name="car_id" value={filters.car_id} onChange={handleFilterChange} placeholder="C12345" />
          <FilterSelect label="Manufacturer" name="manufacturer" value={filters.manufacturer} onChange={handleFilterChange} options={filterOptions.manufacturers} />
          <FilterSelect label="Model" name="model" value={filters.model} onChange={handleFilterChange} options={models} disabled={!filters.manufacturer} />
          <FilterSelect label="Fuel Type" name="fuel_type" value={filters.fuel_type} onChange={handleFilterChange} options={filterOptions.fuelTypes} />
          <FilterInput label="Min Year" name="min_year" value={filters.min_year} onChange={handleFilterChange} placeholder="2015" />
          <FilterInput label="Max Year" name="max_year" value={filters.max_year} onChange={handleFilterChange} placeholder="2024" />
          <FilterInput label="Min Price ($)" name="min_price" value={filters.min_price} onChange={handleFilterChange} placeholder="10000" />
          <FilterInput label="Max Price ($)" name="max_price" value={filters.max_price} onChange={handleFilterChange} placeholder="500000" />
          <div className="flex items-end">
            <button onClick={resetFilters} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={filters.manufacturer ? ` Model Distribution - ${filters.manufacturer}` : " All Manufacturers Distribution"}>
          {modelDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" angle={-30} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" name="Car Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </ChartCard>

        <ChartCard title={filters.manufacturer ? ` $ Sales by Model - ${filters.manufacturer}` : " $ Sales by Manufacturer"}>
          {salesDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={salesDist} 
                  dataKey="totalSales" 
                  nameKey="_id" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90}
                  innerRadius={50}
                  label={(entry) => `${entry._id.substring(0, 10)}`}
                  labelLine={false}
                >
                  {salesDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </ChartCard>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Search Results</h2>
          <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">Found {totalCars} cars</span>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mileage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cars.map((car) => (
                    <tr 
                      key={car._id} 
                      onClick={() => handleRowClick(car)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car._id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.manufacturer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.specifications.year_of_manufacturing}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.specifications.fuel_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.status.mileage.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${car.status.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      {/* Car Detail Modal */}
      {selectedCar && <CarDetailModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  );
};

export default FilterPage;