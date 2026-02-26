import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, StatCard, ChartCard, LoadingSpinner } from '../components/common';

import { COLORS } from '../constants';
import { API_BASE_URL } from '../constants';


// ===== OVERVIEW PAGE  =====
const OverviewPage = () => {
    const [priceData, setPriceData] = useState([]);
    const [mileageData, setMileageData] = useState([]);
    const [accidentData, setAccidentData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalCars: 0, manufacturers: 0, avgPrice: 0 });

    useEffect(() => {
        fetchOverviewData();
    }, []);

    const fetchOverviewData = async () => {
        setLoading(true);
        try {
            const [priceRes, mileageRes, accidentRes, optionsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/cars/stats/price-by-manufacturer`),
                fetch(`${API_BASE_URL}/cars/stats/mileage-distribution`),
                fetch(`${API_BASE_URL}/cars/stats/accident-severity`),
                fetch(`${API_BASE_URL}/cars/filter-options`)
            ]);

            const priceDataRaw = await priceRes.json();
            const mileageDataRaw = await mileageRes.json();
            const accidentDataRaw = await accidentRes.json();
            const options = await optionsRes.json();

            setPriceData(priceDataRaw.map(item => ({
                manufacturer: item._id,
                avgPrice: Math.round(item.avgPrice),
                count: item.count
            })));

            setMileageData(mileageDataRaw.map((item, idx) => {
                // check if current item is "200000+"
                if (item._id === '200000+') {
                    return {
                        range: '200k+',
                        count: item.count
                    };
                }

                // get next boundary for range  
                const nextItem = mileageDataRaw[idx + 1];
                const nextBoundary = (nextItem && typeof nextItem._id === 'number')
                    ? nextItem._id
                    : 200000;

                return {
                    range: `${item._id / 1000}k-${nextBoundary / 1000}k`,
                    count: item.count
                };
            }));

            setAccidentData(accidentDataRaw.map(item => ({
                severity: item._id || 'Unknown',
                count: item.count
            })));

            const totalCars = priceDataRaw.reduce((sum, item) => sum + item.count, 0);
            const avgPrice = Math.round(priceDataRaw.reduce((sum, item) => sum + item.avgPrice, 0) / priceDataRaw.length);

            setStats({
                totalCars: totalCars,
                manufacturers: options.manufacturers.length,
                avgPrice: avgPrice
            });
        } catch (error) {
            console.error('Error fetching overview data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <PageHeader title="Dashboard Overview" subtitle="View key metrics and statistics at a glance" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Cars" value={stats.totalCars.toLocaleString()} icon="/icons/car2.png" color="blue" />
                <StatCard title="Manufacturers" value={stats.manufacturers} icon="/icons/manufacturer.png" color="green" />
                <StatCard title="Avg Price" value={`$${stats.avgPrice.toLocaleString()}`} icon="/icons/money.png" color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Average Price by Manufacturer">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={priceData}>
                            <CartesianGrid strokeDasharray="3 3" /> 
                            {/* Grid background with dashed lines */}
                            <XAxis dataKey="manufacturer" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="avgPrice" fill="#0088FE" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Accident Severity Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={accidentData} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={100} label>
                                {accidentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Mileage Distribution">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mileageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884D8" strokeWidth={2} name="Car Count" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};

export default OverviewPage;