
import React from 'react';

interface ControlPanelProps {
  angle: number;
  onAngleChange: (val: number) => void;
  velocity: number;
  onVelocityChange: (val: number) => void;
  onSend: () => void;
  connected: boolean;
  onInterrupt: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  angle,
  onAngleChange,
  velocity,
  onVelocityChange,
  onSend,
  connected,
  onInterrupt,
}) => {
  // Quantize for display logic if needed, but let parent handle command value
  const displayAngle = Math.round(angle / 5) * 5;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
      
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Servo Orientation</label>
            <h3 className="text-sm font-bold text-gray-800">Target Angle</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-red-600 leading-none">{displayAngle}</span>
            <span className="text-sm font-bold text-red-300">°</span>
          </div>
        </div>
        <div className="px-2">
          <input 
            type="range"
            min="0"
            max="360"
            step="5"
            value={angle}
            onChange={(e) => onAngleChange(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-red-600 hover:accent-red-700 transition-all border border-gray-200"
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-300 mt-3 px-3">
          <span>0°</span>
          <span>180°</span>
          <span>360°</span>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Dynamixel Velocity</label>
            <h3 className="text-sm font-bold text-gray-800">Movement Speed</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 leading-none">{velocity}</span>
          </div>
        </div>
        <div className="px-2">
          <input 
            type="range"
            min="0"
            max="1023"
            step="1"
            value={velocity}
            onChange={(e) => onVelocityChange(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-slate-800 hover:accent-slate-900 transition-all border border-gray-200"
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-300 mt-3 px-3">
          <span>IDLE</span>
          <span>MAX (1023)</span>
        </div>
      </section>

      <div className="flex flex-col gap-3 pt-4">
        <button 
          onClick={onSend}
          disabled={!connected}
          className={`group relative w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg overflow-hidden ${
            connected 
            ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-200' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Update Servos
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </button>
        
        <button 
          onClick={onInterrupt}
          disabled={!connected}
          className={`w-full py-3 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider ${
            connected 
            ? 'border-red-100 text-red-500 hover:bg-red-50 active:scale-95' 
            : 'border-transparent text-transparent pointer-events-none'
          }`}
        >
          Send Interrupt (Ctrl+C)
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
