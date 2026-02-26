import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, ChartCard, LoadingSpinner } from '../components/common';
import { COLORS, API_BASE_URL } from '../constants';


// ===== SERVICES PAGE =====

const ServicesPage = () => {
    const [serviceAnalytics, setServiceAnalytics] = useState({ byType: [] });
    const [serviceTimeline, setServiceTimeline] = useState([]);
    const [serviceByDealer, setServiceByDealer] = useState([]);
    const [serviceCostByMfr, setServiceCostByMfr] = useState([]);
    const [topServicedCars, setTopServicedCars] = useState([]);
    const [costDistribution, setCostDistribution] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        dealer_id: '',
        year: '',
        manufacturer: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchServiceData();
    }, [filters]);

    const fetchInitialData = async () => {
        try {
            const [filteropt, yearsRes, dealersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/cars/filter-options`),
                fetch(`${API_BASE_URL}/cars/analytics/service-years`),
                fetch(`${API_BASE_URL}/dealers/list`)
            ]);

            const options = await filteropt.json();
            const yearList = await yearsRes.json();
            const dealerList = await dealersRes.json();
            const dealerIds = dealerList.map(d => d._id).sort();

            setDealers(dealerIds);
            setManufacturers(options.manufacturers);
            setYears(yearList);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchServiceData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const [analyticsRes, timelineRes, byDealerRes, byCostRes, topCarsRes, distRes] = await Promise.all([
                fetch(`${API_BASE_URL}/cars/analytics/service-analytics?${queryParams}`),
                fetch(`${API_BASE_URL}/cars/analytics/service-timeline?${queryParams}`),
                fetch(`${API_BASE_URL}/cars/analytics/service-by-dealer?${queryParams}`),
                fetch(`${API_BASE_URL}/cars/analytics/service-cost-by-manufacturer?${queryParams}`),
                fetch(`${API_BASE_URL}/cars/analytics/top-serviced-cars`),
                fetch(`${API_BASE_URL}/cars/analytics/service-cost-distribution`)
            ]);

            const analytics = await analyticsRes.json();
            const timeline = await timelineRes.json();
            const byDealer = await byDealerRes.json();
            const byCost = await byCostRes.json();
            const topCars = await topCarsRes.json();
            const dist = await distRes.json();

            setServiceAnalytics(analytics);
            setServiceTimeline(timeline);
            setServiceByDealer(byDealer);
            setServiceCostByMfr(byCost);
            setTopServicedCars(topCars);
            setCostDistribution(dist.map(item => ({
                range: item._id === '1000+' ? '1000+' : `$${item._id}-${item._id + 100}`,
                count: item.count
            })));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({ dealer_id: '', year: '', manufacturer: '' });
    };


    // Helper function to generate dynamic titles
    // Helper function với tùy chọn loại trừ filters
    const getFilterSuffix = (exclude = []) => {
        const parts = [];
        if (!exclude.includes('dealer_id') && filters.dealer_id)
            parts.push(`Dealer: ${filters.dealer_id}`);
        if (!exclude.includes('manufacturer') && filters.manufacturer)
            parts.push(`${filters.manufacturer}`);
        if (!exclude.includes('year') && filters.year)
            parts.push(`${filters.year}`);
        return parts.length > 0 ? ` - ${parts.join(' | ')}` : '';
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Service Analytics" subtitle="Comprehensive service analysis and trends" />

            {/* Filter Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Filter Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dealer</label>
                        <select
                            name="dealer_id"
                            value={filters.dealer_id}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Dealers</option>
                            {dealers.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <select
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <select
                            name="manufacturer"
                            value={filters.manufacturer}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Manufacturers</option>
                            {manufacturers.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart: % by Service Type */}
                        <ChartCard title={`Service Type Distribution${getFilterSuffix()}`}>
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={serviceAnalytics.byType}
                                        dataKey="count"
                                        nameKey="_id"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                    // label={(entry) => `${entry._id}: ${entry.count}`}
                                    >
                                        {serviceAnalytics.byType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Line Chart: Service Timeline */}
                        <ChartCard title={
                            filters.year
                                ? `Services by Month${getFilterSuffix()}`
                                : `Services by Year${getFilterSuffix()}`
                        }>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={serviceTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" label={{ value: filters.year ? 'Month' : 'Year', position: 'insideBottom', offset: -5 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#8884D8" strokeWidth={2} name="Service Count" />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Chart: Service by Dealer */}
                        <ChartCard title={`Top 10 Dealers by Service Count${getFilterSuffix(['dealer_id'])}`}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={serviceByDealer}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#00C49F" name="Services" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Bar Chart: Avg Cost by Manufacturer */}
                        <ChartCard title={`Average Service Cost per Manufacturer${getFilterSuffix(['manufacturer'])}`}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={serviceCostByMfr}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                    <Bar dataKey="avgCost" fill="#FF8042" name="Avg Cost ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Histogram: Cost Distribution */}
                    <ChartCard title="Service Cost Distribution (All Services)">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={costDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#FFBB28" name="Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Table: Top 10 Cars with Most Services */}
                    <ChartCard title="Top 10 Cars with Most Services (All Time)">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Car ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Count</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {topServicedCars.map((car) => (
                                        <tr key={car._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{car._id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.manufacturer}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.model}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{car.dealer_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{car.serviceCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </>
            )}
        </div>
    );
};

export default ServicesPage;