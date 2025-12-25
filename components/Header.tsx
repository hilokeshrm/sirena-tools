
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100 py-3 px-6 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">LS6 <span className="text-red-600">Terminal</span></h1>
      </div>
      <div className="hidden md:flex gap-4 text-sm text-gray-500 font-medium">
        <span>Win / Mac / Linux Support</span>
        <span>•</span>
        <span>Web Serial Enabled</span>
      </div>
    </header>
  );
};

export default Header;
