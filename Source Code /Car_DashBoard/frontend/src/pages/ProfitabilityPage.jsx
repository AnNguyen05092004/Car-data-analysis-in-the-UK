import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, ChartCard, LoadingSpinner } from '../components/common';
import { API_BASE_URL } from '../constants';

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// ===== PROFITABILITY PAGE =====
const ProfitabilityPage = () => {
  const [summary, setSummary] = useState({});
  const [manufacturers, setManufacturers] = useState([]);
  const [dealerProfit, setDealerProfit] = useState([]);
  const [accidentImpact, setAccidentImpact] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitabilityData();
  }, []);

  const fetchProfitabilityData = async () => {
    setLoading(true);
    try {
      const [summaryRes, mfrRes, dealerRes, accidentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cars/analytics/profitability-summary`),
        fetch(`${API_BASE_URL}/cars/analytics/profitable-manufacturers`),
        fetch(`${API_BASE_URL}/dealers/analytics/dealer-profitability`),
        fetch(`${API_BASE_URL}/cars/analytics/accident-impact`)
      ]);

      const summaryData = await summaryRes.json();
      const mfrData = await mfrRes.json();
      const dealerData = await dealerRes.json();
      const accidentData = await accidentRes.json();

      setSummary(summaryData);
      setManufacturers(mfrData);
      setDealerProfit(dealerData);
      setAccidentImpact(accidentData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const topDealers = dealerProfit.slice(0, 3);

  // Prepare pie chart data 
  const pieData = accidentImpact
    .sort((a, b) => b.accidentRate - a.accidentRate)
    .slice(0, 10)
    .map(item => ({
      name: item._id,
      value: parseFloat(item.accidentRate.toFixed(2))
    }));

  return (
    <div className="space-y-6">
      <PageHeader title="Profitability Analysis" subtitle="Comprehensive profit and loss analysis" />

      {/* Section 1: Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-500 p-6 rounded-lg shadow-lg text-white">
          <p className="text-sm opacity-90 mb-1">Total Sales Value</p>
          <p className="text-3xl font-bold">${(summary.summary?.totalSales || 0).toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-2">{summary.summary?.carCount || 0} cars sold</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-400 p-6 rounded-lg shadow-lg text-white">
          <p className="text-sm opacity-90 mb-1">Total Repair Cost</p>
          <p className="text-3xl font-bold">${(summary.summary?.totalRepairCost || 0).toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-2">Accident repairs</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-500 p-6 rounded-lg shadow-lg text-white">
          <p className="text-sm opacity-90 mb-1">Net Profit</p>
          <p className="text-3xl font-bold">${(summary.summary?.netProfit || 0).toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-2">Sales - Repairs</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-500 p-6 rounded-lg shadow-lg text-white">
          <p className="text-sm opacity-90 mb-1">Top Manufacturer</p>
          <p className="text-2xl font-bold">{summary.topManufacturer?.manufacturer || 'N/A'}</p>
          <p className="text-xs opacity-75 mt-2">Most profitable</p>
        </div>
      </div>

      {/* Section 2: Profitability by Manufacturer */}
      <ChartCard title="Net Profit per Manufacturer">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={manufacturers}
                    margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="manufacturer" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="profit" fill="#00C49F" name="Net Profit ($)" />
            <Bar dataKey="totalSales" fill="#0088FE" name="Total Sales ($)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Manufacturer Profitability Details">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cars</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repair Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {manufacturers.slice(0, 15).map((mfr, idx) => {
                const margin = ((mfr.profit / mfr.totalSales) * 100).toFixed(1);
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mfr.manufacturer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mfr.carCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${mfr.totalSales.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">${Math.round(mfr.avgRepairCost * mfr.carCount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${Math.round(mfr.profit).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Section 3: Dealer Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top 15 Dealers by Profit">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dealerProfit.slice(0, 15)}
                      margin={{ top: 30, right: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dealer_id" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="profit" fill="#00C49F" name="Profit ($)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 3 Most Profitable Dealers">
          <div className="space-y-4">
            {topDealers.map((dealer, idx) => {
              const medal = ['🥇', '🥈', '🥉'][idx];
              return (
                <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{medal} Dealer {dealer.dealer_id}</p>
                      <p className="text-sm text-gray-600">Cars Sold: {dealer.carCount}</p>
                      <p className="text-sm text-gray-600">Sales: ${dealer.totalSales.toLocaleString()}</p>
                      <p className="text-sm text-red-600">Repairs: ${dealer.totalRepairCost.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">${Math.round(dealer.profit).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Net Profit</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Section 4: Accident Impact on Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Average Repair Cost per Manufacturer">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={accidentImpact} margin={{ top: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-45} textAnchor="end" height={100} />
              <YAxis/>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="avgRepairCost" fill="#FF8042" name="Avg Repair Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Accident Rate by Manufacturer">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Accident Impact Details">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Accidents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cars with Accidents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cars</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accident Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Repair Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accidentImpact.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalAccidents}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.carsWithAccidents}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.carCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      item.accidentRate > 60 ? 'text-red-500' : 
                      item.accidentRate > 30 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {item.accidentRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    ${Math.round(item.avgRepairCost).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

export default ProfitabilityPage;