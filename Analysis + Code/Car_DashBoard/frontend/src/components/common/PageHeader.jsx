import React from 'react';

// PageHeader Component
export const PageHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
    <p className="text-gray-600">{subtitle}</p>
  </div>
);