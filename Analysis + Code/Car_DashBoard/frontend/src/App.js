
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import OverviewPage from './pages/OverviewPage';
import FilterPage from './pages/FilterPage';
import DealersPage from './pages/DealersPage';
import ServicesPage from './pages/ServicesPage';
import ProfitabilityPage from './pages/ProfitabilityPage';
import './App.css';


function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <div className="ml-64 p-8">
        {currentPage === 'overview' && <OverviewPage />}
        {currentPage === 'filter' && <FilterPage />}
        {currentPage === 'dealers' && <DealersPage />}
        {currentPage === 'services' && <ServicesPage />}
        {currentPage === 'profitability' && <ProfitabilityPage />}
      </div>
    </div>
  );
}
export default App;