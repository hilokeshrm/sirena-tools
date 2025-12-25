
import React from 'react';
import { SerialStatus, ServoConfig } from '../types';

interface SidebarProps {
  status: SerialStatus;
  baudRate: number;
  onBaudChange: (val: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  servoConfig: ServoConfig;
  onServoConfigChange: (val: ServoConfig) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  status,
  baudRate,
  onBaudChange,
  onConnect,
  onDisconnect,
  servoConfig,
  onServoConfigChange,
}) => {
  const commonBauds = [9600, 38400, 57600, 115200, 230400, 1000000, 2000000];

  const updateServoCount = (count: number) => {
    const num = Math.max(1, Math.min(16, count));
    const newIds = [...servoConfig.servoIds];
    while (newIds.length < num) newIds.push(newIds.length);
    onServoConfigChange({ ...servoConfig, numServos: num, servoIds: newIds.slice(0, num) });
  };

  const updateServoId = (index: number, id: number) => {
    const newIds = [...servoConfig.servoIds];
    newIds[index] = Math.max(0, Math.min(15, id));
    onServoConfigChange({ ...servoConfig, servoIds: newIds });
  };

  return (
    <aside className="w-80 border-r border-gray-100 bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-8 border-b border-gray-50 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
           <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-gray-900 leading-tight">LS6 <span className="text-red-600">Pro</span></h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnostic Suite</p>
        </div>
      </div>

      <div className="p-8 space-y-10">
        <section>
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Serial Interface</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Baud Rate</label>
              <select 
                value={baudRate}
                onChange={(e) => onBaudChange(parseInt(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                {commonBauds.map(b => <option key={b} value={b}>{b} bps</option>)}
              </select>
            </div>
            
            <button
              onClick={status.connected ? onDisconnect : onConnect}
              className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md ${
                status.connected 
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                : 'bg-slate-900 text-white hover:bg-black active:scale-95 shadow-slate-200'
              }`}
            >
              {status.connected ? 'Terminate Link' : 'Establish Connection'}
            </button>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${status.connected ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest ${status.connected ? 'text-green-600' : 'text-gray-400'}`}>
                  {status.connected ? 'Online' : 'Offline'}
                </span>
                {status.connected && <span className="text-[10px] font-bold text-green-700 truncate max-w-[160px]">{status.portName}</span>}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Actuator Array</h2>
            <div className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black">{servoConfig.numServos} Units</div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Bus Size (1-16)</label>
              <input 
                type="number" 
                min="1" 
                max="16"
                value={servoConfig.numServos}
                onChange={(e) => updateServoCount(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-4">Code ID Mapping</label>
              <div className="grid grid-cols-4 gap-3">
                {servoConfig.servoIds.map((id, idx) => (
                  <div key={idx} className="group flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase text-center">#{idx+1}</span>
                    <input 
                      type="number"
                      min="0"
                      max="15"
                      value={id}
                      onChange={(e) => updateServoId(idx, parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 text-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500 group-hover:border-gray-300 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <div className="mt-auto p-8 border-t border-gray-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diagnostic v1.2</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
