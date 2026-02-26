import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants';

const MenuItem = ({ icon, label, page, currentPage, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={`w-full flex items-center space-x-3 px-6 py-4 transition-all duration-200 ${
      currentPage === page 
        ? 'bg-blue-600 border-r-4 border-blue-400' 
        : 'hover:bg-gray-700'
    }`}
  >
    {typeof icon === 'string' && (icon.startsWith('/') || icon.startsWith('http')) ? (
      <img src={icon} alt={label} className="w-6 h-6 object-contain" />
    ) : (
      <span className="text-2xl">{icon}</span>
    )}
    <span className="font-medium">{label}</span>
  </button>
);

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const [totalCars, setTotalCars] = useState(0);

  useEffect(() => {
  const fetchTotalCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/stats/price-by-manufacturer`);
      const data = await res.json();

      const total = data.reduce((sum, item) => sum + item.count, 0); // Gộp nhiều phần tử trong mảng thành 1 giá trị duy nhất
//    let total = 0;
//    for (let i = 0; i < data.length; i++) {
//        total += data[i].count;
//    }

      setTotalCars(total);
    } catch (err) {
      console.error(err);
    }
  };

  fetchTotalCars();
}, []);


  return (
    <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white min-h-screen fixed left-0 top-0 shadow-2xl">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Car Analytics</h1>
            <p className="text-xs text-gray-400">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <MenuItem icon="/icons/dashboard2.png" label="Overview" page="overview" currentPage={currentPage} onClick={setCurrentPage} />
        <MenuItem icon="/icons/filter.png" label="Filter & Search" page="filter" currentPage={currentPage} onClick={setCurrentPage} />
        <MenuItem icon="/icons/dealer.png" label="Dealer Analysis" page="dealers" currentPage={currentPage} onClick={setCurrentPage} />
        <MenuItem icon="/icons/service2.png" label="Service Analysis" page="services" currentPage={currentPage} onClick={setCurrentPage} />
        <MenuItem icon="/icons/profit.png" label="Profitability" page="profitability" currentPage={currentPage} onClick={setCurrentPage} />
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Total Cars</p>
          <p className="text-2xl font-bold">{totalCars.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;