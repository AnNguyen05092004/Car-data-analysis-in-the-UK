import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PageHeader, ChartCard, LoadingSpinner, FilterInput, Pagination } from '../components/common';
import { API_BASE_URL } from '../constants';



// ===== DEALERS PAGE =====

const DealersPage = () => {
    const [dealerStats, setDealerStats] = useState([]);
    const [topAccidentDealers, setTopAccidentDealers] = useState([]);
    const [dealersByCity, setDealersByCity] = useState([]);
    const [dealerLocations, setDealerLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [filters, setFilters] = useState({
        min_sales: '',
        max_sales: '',
        min_cars: '',
        sort_by: 'totalSalesValue'
    });

    const [appliedFilters, setAppliedFilters] = useState(filters);
    const [currentPage, setCurrentPage] = useState(1);


    useEffect(() => {
        fetchDealerData();
        loadGoogleMaps();
    }, [appliedFilters]);

    const handleApplyFilters = () => {
        setAppliedFilters(filters); // Apply filters when click button
        setCurrentPage(1);
    };

    const loadGoogleMaps = () => {
        if (window.google && window.google.maps) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAp0CJvfVbpdNWWs_CH3oZ6DzXKNXDJN0o&libraries=visualization`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
    };

    useEffect(() => {
        if (mapLoaded && dealerLocations.length > 0) {
            initMap();
        }
    }, [mapLoaded, dealerLocations]);

    const initMap = () => {
        const mapElement = document.getElementById('dealer-map');
        if (!mapElement || !window.google) return;

        // Center on UK
        const map = new window.google.maps.Map(mapElement, {
            zoom: 6,
            center: { lat: 53.5, lng: -1.5 }, // UK center
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        // Add markers for each dealer
        dealerLocations.forEach(dealer => {
            const marker = new window.google.maps.Marker({
                position: { lat: dealer.lat, lng: dealer.lng },
                map: map,
                title: dealer.name,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#0088FE',
                    fillOpacity: 0.8,
                    strokeWeight: 2,
                    strokeColor: '#ffffff'
                }
            });

            // When marker is clicked, show info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${dealer.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">📍 ${dealer.city}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">ID: ${dealer.id}</p>
          </div>
        `
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });

        // Add heatmap layer if available
        if (window.google.maps.visualization) {
            const heatmapData = dealerLocations.map(dealer => ({
                location: new window.google.maps.LatLng(dealer.lat, dealer.lng),
                weight: 1
            }));

            const heatmap = new window.google.maps.visualization.HeatmapLayer({
                data: heatmapData,
                radius: 30,
                opacity: 0.6
            });

            heatmap.setMap(map);
        }
    };

    const fetchDealerData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const [statsRes, accidentRes, cityRes, locationsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/dealers/analytics/dealers?${queryParams}`),
                fetch(`${API_BASE_URL}/dealers/analytics/top-dealers-accident`),
                fetch(`${API_BASE_URL}/dealers/analytics/dealers-by-city`),
                fetch(`${API_BASE_URL}/dealers/analytics/dealer-locations`)
            ]);

            const stats = await statsRes.json();
            const accidents = await accidentRes.json();
            const cities = await cityRes.json();
            const locations = await locationsRes.json();

            setDealerStats(stats);
            setTopAccidentDealers(accidents);
            setDealersByCity(cities);
            setDealerLocations(locations);
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
        setFilters({ min_sales: '', max_sales: '', min_cars: '', sort_by: 'totalSalesValue' });
    };

    // compute pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(dealerStats.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDealers = dealerStats.slice(startIndex, endIndex);

    return (
        <div className="space-y-6">
            <PageHeader title="Dealer Analysis" subtitle="Analyze dealer performance and geographic distribution" />


            {loading ? <LoadingSpinner /> : (
                <>
                    {/* Google Maps Heatmap */}
                    <ChartCard title=" Dealer Locations Map">
                        <div className="space-y-4">
                            <div
                                id="dealer-map"
                                className="w-full h-96 rounded-lg border border-gray-300"
                                style={{ minHeight: '400px' }}
                            >
                                {!mapLoaded && (
                                    <div className="h-full flex items-center justify-center bg-gray-50">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-600">Loading map...</p>
                                            <p className="text-xs text-gray-500 mt-2">Note: You need a Google Maps API key</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
                                <span className="text-sm text-gray-700">
                                    📍 Total Dealer Locations: <strong>{dealerLocations.length}</strong>
                                </span>
                                <span className="text-xs text-gray-500">
                                    Click markers for details
                                </span>
                            </div>
                        </div>
                    </ChartCard>

                    {/* Dealers by City Bar Chart */}
                    <ChartCard title="Dealer Distribution by City">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={dealersByCity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#0088FE" name="Dealer Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Filter Panel */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800"> Filter Options</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FilterInput
                                label="Min Sales ($)"
                                name="min_sales"
                                value={filters.min_sales}
                                onChange={handleFilterChange}
                                placeholder="50000"
                            />
                            <FilterInput
                                label="Max Sales ($)"
                                name="max_sales"
                                value={filters.max_sales}
                                onChange={handleFilterChange}
                                placeholder="500000"
                            />
                            <FilterInput
                                label="Min Cars"
                                name="min_cars"
                                value={filters.min_cars}
                                onChange={handleFilterChange}
                                placeholder="10"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                <select
                                    name="sort_by"
                                    value={filters.sort_by}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="totalSalesValue">Total Sales</option>
                                    <option value="cars">Car Count</option>
                                    <option value="avgPrice">Average Price</option>
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleApplyFilters}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Dealer Sales Performance">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dealerStats.slice(0, 10)}
                                    margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />

                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="totalSalesValue" fill="#0088FE" name="Total Sales ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>



                        <ChartCard title="Top 3 Dealers by Accident Ratio">
                            <div className="space-y-4">
                                {topAccidentDealers.map((dealer, idx) => (
                                    <div key={idx} className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg text-gray-800">Dealer {dealer._id}</p>
                                                <p className="text-sm text-gray-600">Total Cars: {dealer.totalCars}</p>
                                                <p className="text-sm text-gray-600">Accident Cars: {dealer.accidentCars}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-red-600">{dealer.accidentRatio.toFixed(1)}%</p>
                                                <p className="text-xs text-gray-500">Accident Ratio</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </div>

                    <ChartCard title="Dealer Performance Table">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cars</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentDealers.map((dealer) => (
                                        <tr key={dealer._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dealer._id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dealer.totalCars}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${dealer.totalSalesValue.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${Math.round(dealer.avgPrice).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </ChartCard>
                </>
            )}
        </div>
    );
};

export default DealersPage;