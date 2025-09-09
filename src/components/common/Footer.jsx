// src/components/common/Footer.jsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white/50 backdrop-blur-sm mt-12 py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
        <p>
          <strong>Weatheredstrip</strong> &copy; {new Date().getFullYear()}. 
          Data sourced from NAV Canada. Not for official flight planning.
        </p>
        <p className="mt-1">
          Designed for aviation professionals. Always consult official sources before flight.
        </p>
      </div>
    </footer>
  );
};

export default Footer;