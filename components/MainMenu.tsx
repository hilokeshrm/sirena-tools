
import React from 'react';
import { ProductType } from '../types';

interface MainMenuProps {
  onSelect: (product: ProductType) => void;
}

const products: { name: ProductType; desc: string; icon: string }[] = [
  { name: 'Nino', desc: 'Dual-Axis Mobile Base', icon: '◰' },
  { name: 'Nino T', desc: 'Tri-Axis Mobile Platform', icon: '◱' },
  { name: 'Perro', desc: '12-DOF Quadruped Field Unit', icon: '▥' },
  { name: 'Twist', desc: 'High-Torque Rotary Unit', icon: '◎' },
  { name: 'Robotic Arm V1', desc: '4-Axis Precision Manipulator', icon: '⌇' },
  { name: 'Robotic Arm V2', desc: '6-Axis Industrial Manipulator', icon: '≣' },
  { name: 'Daisy Chain', desc: 'Generic Custom Multi-Servo Link', icon: '⛓' },
];

const MainMenu: React.FC<MainMenuProps> = ({ onSelect }) => {
  return (
    <div className="h-screen w-screen bg-[#f0f0f0] flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="max-w-4xl w-full">
        <div className="mb-12 flex flex-col items-center gap-2">
           <h1 className="text-[42px] font-black tracking-tighter leading-none">LS6 FIELD TERMINAL</h1>
           <div className="flex items-center gap-4 text-[10px] font-bold text-[#888] uppercase tracking-[0.3em]">
             <span>Engineering Toolroom</span>
             <span className="w-1 h-1 bg-[#d1d1d1] rounded-full"></span>
             <span>Version 2.5.0</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <button
              key={p.name}
              onClick={() => onSelect(p.name)}
              className="group bg-white te-border rounded-xl p-8 flex flex-col items-start text-left transition-all hover:border-[#ff4d00] hover:shadow-xl te-key"
            >
              <div className="text-4xl mb-4 group-hover:te-orange transition-colors">{p.icon}</div>
              <h2 className="text-xl font-black tracking-tight mb-1">{p.name}</h2>
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">{p.desc}</p>
              
              <div className="mt-8 pt-4 border-t border-[#f0f0f0] w-full flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-black text-[#ff4d00] uppercase tracking-widest">Load Firmware</span>
                <span className="text-lg">→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-[#d1d1d1] flex justify-between items-center text-[9px] font-bold text-[#aaa] uppercase tracking-widest">
           <span>Teenage Engineering Inspired Interface</span>
           <div className="flex gap-8">
             <span>System Status: Ready</span>
             <span>Voltage: 24.2V</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
