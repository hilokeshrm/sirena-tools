import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-[#d1d1d1] py-2 px-4 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest">LS6 Field Terminal</span>
        <span className="text-[9px] font-bold text-[#aaa] uppercase tracking-tighter">System OK</span>
      </div>
      <div className="flex gap-4 text-[9px] font-bold uppercase text-[#888]">
        <span>Clock: {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </header>
  );
};

export default Header;