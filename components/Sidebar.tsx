
import React, { useState } from 'react';
import { SerialStatus, ServoConfig, ServoType, isMXServo, getCenterAngle } from '../types';

const SERVO_TYPES: ServoType[] = [
  'AX-12A',
  'AX-18A',
  'AX-12W',
  'MX-28',
  'MX-64',
  'MX-106',
];

interface SidebarProps {
  status: SerialStatus;
  baudRate: number;
  onBaudChange: (val: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  servoConfig: ServoConfig;
  onServoConfigChange: (val: any) => void;
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
  const [servoTypeMode, setServoTypeMode] = useState<'single' | 'multiple'>('single');
  const [servoIdMode, setServoIdMode] = useState<'incremental' | 'random'>('incremental');

  const updateServoCount = (count: number) => {
    const num = Math.max(1, Math.min(20, count));
    const baseServoType = servoConfig.servos.length > 0 ? servoConfig.servos[0].servoType : 'AX-12A';
    
    // If in incremental mode, regenerate all IDs from scratch
    if (servoIdMode === 'incremental') {
      const newServos = [];
      const newIds = [];
      
      for (let i = 0; i < num; i++) {
        const servoType = servoTypeMode === 'single' 
          ? baseServoType 
          : SERVO_TYPES[Math.floor(Math.random() * SERVO_TYPES.length)];
        
        const defaultAngle = isMXServo(servoType) ? getCenterAngle(servoType, '360') : 150;
        newServos.push({
          id: i, // Active ID = servoId - 1 (where servoId = i + 1)
          servoId: i + 1, // Physical Servo ID (1-based): 1, 2, 3, ...
          servoType: servoType,
          angle: defaultAngle,
          velocity: 256,
          active: true,
          angleMode: isMXServo(servoType) ? '360' : undefined
        });
        newIds.push(i + 1);
      }
      
      onServoConfigChange({
        ...servoConfig,
        numServos: num,
        servoIds: newIds,
        servos: newServos
      });
      return;
    }
    
    // Random mode: keep existing servos, add new ones with random IDs
    const newServos = [...servoConfig.servos];
    const newIds = [...servoConfig.servoIds];
    
    // If reducing count, just slice
    if (num < newServos.length) {
      onServoConfigChange({
        ...servoConfig,
        numServos: num,
        servoIds: newIds.slice(0, num),
        servos: newServos.slice(0, num)
      });
      return;
    }
    
    // Add new servos
    while (newServos.length < num) {
      const nextActiveId = newServos.length; // 0-based
      
      // Random mode: generate random ID between 1-253, ensuring uniqueness
      let randomId: number;
      do {
        randomId = Math.floor(Math.random() * 253) + 1;
      } while (newIds.includes(randomId));
      
      // Determine servo type based on mode
      const servoType = servoTypeMode === 'single'
        ? baseServoType
        : SERVO_TYPES[Math.floor(Math.random() * SERVO_TYPES.length)];
      
      const defaultAngle = isMXServo(servoType) ? getCenterAngle(servoType, '360') : 150;
      newServos.push({ 
        id: randomId - 1, // Active ID = servoId - 1
        servoId: randomId, // Physical Servo ID (1-based, random)
        servoType: servoType,
        angle: defaultAngle, 
        velocity: 256,
        active: true,
        angleMode: isMXServo(servoType) ? '360' : undefined
      });
      newIds.push(randomId);
    }
    
    onServoConfigChange({
      ...servoConfig,
      numServos: num,
      servoIds: newIds.slice(0, num),
      servos: newServos.slice(0, num)
    });
  };

  const handleServoTypeModeChange = (mode: 'single' | 'multiple') => {
    setServoTypeMode(mode);
    if (mode === 'single' && servoConfig.servos.length > 0) {
      // Apply first servo's type to all servos
      const baseType = servoConfig.servos[0].servoType;
      const newServos = servoConfig.servos.map(s => ({ ...s, servoType: baseType }));
      onServoConfigChange({ ...servoConfig, servos: newServos });
    }
  };

  const handleServoIdModeChange = (mode: 'incremental' | 'random') => {
    setServoIdMode(mode);
    if (mode === 'incremental') {
      // Regenerate IDs incrementally: servo IDs 1,2,3... and active IDs = servoId - 1
      const newServos = servoConfig.servos.map((s, idx) => ({
        ...s,
        servoId: idx + 1, // 1-based servo ID
        id: idx // Active ID = servoId - 1 (where servoId = idx + 1)
      }));
      const newIds = newServos.map(s => s.servoId);
      onServoConfigChange({ ...servoConfig, servos: newServos, servoIds: newIds });
    } else {
      // Generate random IDs with active IDs = servoId - 1
      const newIds: number[] = [];
      const newServos = servoConfig.servos.map((s, idx) => {
        let randomId: number;
        do {
          randomId = Math.floor(Math.random() * 253) + 1;
        } while (newIds.includes(randomId));
        newIds.push(randomId);
        return { 
          ...s, 
          servoId: randomId,
          id: randomId - 1 // Active ID = servoId - 1
        };
      });
      onServoConfigChange({ ...servoConfig, servos: newServos, servoIds: newIds });
    }
  };

  const updateServoType = (index: number, servoType: ServoType) => {
    const newServos = [...servoConfig.servos];
    const defaultAngle = isMXServo(servoType) ? getCenterAngle(servoType, '360') : 150;
    if (servoTypeMode === 'single') {
      // In single mode, update all servos to the same type
      newServos.forEach(s => {
        s.servoType = servoType;
        if (isMXServo(servoType)) {
          s.angleMode = '360';
          s.angle = defaultAngle;
        } else {
          s.angleMode = undefined;
          s.angle = defaultAngle;
        }
      });
    } else {
      // In multiple mode, only update the selected servo
      const updatedServo = { ...newServos[index], servoType };
      if (isMXServo(servoType)) {
        updatedServo.angleMode = '360';
        updatedServo.angle = defaultAngle;
      } else {
        updatedServo.angleMode = undefined;
        updatedServo.angle = defaultAngle;
      }
      newServos[index] = updatedServo;
    }
    onServoConfigChange({ ...servoConfig, servos: newServos });
  };

  const updateServoId = (index: number, servoId: number) => {
    const newServos = [...servoConfig.servos];
    const newIds = [...servoConfig.servoIds];
    const clampedServoId = Math.max(1, Math.min(253, servoId));
    newServos[index] = { ...newServos[index], servoId: clampedServoId, id: clampedServoId - 1 };
    newIds[index] = clampedServoId;
    onServoConfigChange({ ...servoConfig, servos: newServos, servoIds: newIds });
  };

  const deleteServo = (index: number) => {
    if (servoConfig.servos.length <= 1) return; // Don't allow deleting the last servo
    const newServos = servoConfig.servos.filter((_, i) => i !== index);
    const newIds = newServos.map(s => s.servoId);
    // Recalculate active IDs based on servo IDs
    const updatedServos = newServos.map(s => ({ ...s, id: s.servoId - 1 }));
    onServoConfigChange({
      ...servoConfig,
      numServos: newServos.length,
      servos: updatedServos,
      servoIds: newIds
    });
  };

  const moveServoToTop = (index: number) => {
    if (index === 0) return; // Already at top
    const newServos = [...servoConfig.servos];
    const [moved] = newServos.splice(index, 1);
    newServos.unshift(moved);
    const newIds = newServos.map(s => s.servoId);
    // Recalculate active IDs based on servo IDs
    const updatedServos = newServos.map(s => ({ ...s, id: s.servoId - 1 }));
    onServoConfigChange({
      ...servoConfig,
      servos: updatedServos,
      servoIds: newIds
    });
  };

  const moveServoToBottom = (index: number) => {
    if (index === servoConfig.servos.length - 1) return; // Already at bottom
    const newServos = [...servoConfig.servos];
    const [moved] = newServos.splice(index, 1);
    newServos.push(moved);
    const newIds = newServos.map(s => s.servoId);
    // Recalculate active IDs based on servo IDs
    const updatedServos = newServos.map(s => ({ ...s, id: s.servoId - 1 }));
    onServoConfigChange({
      ...servoConfig,
      servos: updatedServos,
      servoIds: newIds
    });
  };

  const toggleServoActive = (index: number) => {
    const newServos = [...servoConfig.servos];
    newServos[index] = { ...newServos[index], active: !(newServos[index].active ?? true) };
    onServoConfigChange({ ...servoConfig, servos: newServos });
  };


  const handleBaudRateChange = (newBaudRate: number) => {
    onBaudChange(newBaudRate);
    onServoConfigChange({ ...servoConfig, baudRate: newBaudRate });
  };

  return (
    <aside className="w-64 border-r border-[#d1d1d1] bg-[#f0f0f0] flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-[#d1d1d1] flex flex-col gap-4">
        <div>
          <h1 className="text-[18px] font-black tracking-tighter uppercase">Servo Controller</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.connected ? 'te-bg-orange' : 'bg-[#d1d1d1]'}`}></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#888]">Link Status</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8">
        <section>
          <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-3">01 Connection</label>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-bold text-[#aaa] uppercase">Baud Rate</span>
              <select 
                value={servoConfig.baudRate || baudRate}
                onChange={(e) => handleBaudRateChange(parseInt(e.target.value))}
                className="w-full bg-white te-border rounded-sm py-1.5 px-2 text-[11px] font-bold focus:outline-none"
              >
                {commonBauds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
            <button
              onClick={status.connected ? onDisconnect : onConnect}
              className={`w-full py-2 te-key text-[10px] font-black uppercase tracking-widest ${
                status.connected ? 'text-red-500' : 'text-[#1a1a1a]'
              }`}
            >
              {status.connected ? 'Eject Device' : 'Mount Device'}
            </button>
          </div>
        </section>

        <section>
          <label className="block text-[10px] font-black text-[#555] uppercase tracking-widest mb-3">02 Setup</label>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-bold text-[#aaa] uppercase">Servo Limit</span>
              <input 
                type="number" 
                min="1" 
                max="20"
                value={servoConfig.numServos}
                onChange={(e) => updateServoCount(parseInt(e.target.value) || 1)}
                className="w-12 bg-white te-border text-center rounded-sm py-1 text-[11px] font-bold"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-bold text-[#aaa] uppercase">Servo Type Mode</span>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="servoTypeMode"
                    value="single"
                    checked={servoTypeMode === 'single'}
                    onChange={(e) => handleServoTypeModeChange('single')}
                    className="w-3 h-3 accent-[#ff4d00]"
                  />
                  <span className="text-[9px] font-bold text-[#555]">Single</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="servoTypeMode"
                    value="multiple"
                    checked={servoTypeMode === 'multiple'}
                    onChange={(e) => handleServoTypeModeChange('multiple')}
                    className="w-3 h-3 accent-[#ff4d00]"
                  />
                  <span className="text-[9px] font-bold text-[#555]">Multiple</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-bold text-[#aaa] uppercase">Servo ID Mode</span>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="servoIdMode"
                    value="incremental"
                    checked={servoIdMode === 'incremental'}
                    onChange={(e) => handleServoIdModeChange('incremental')}
                    className="w-3 h-3 accent-[#ff4d00]"
                  />
                  <span className="text-[9px] font-bold text-[#555]">Incremental</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="servoIdMode"
                    value="random"
                    checked={servoIdMode === 'random'}
                    onChange={(e) => handleServoIdModeChange('random')}
                    className="w-3 h-3 accent-[#ff4d00]"
                  />
                  <span className="text-[9px] font-bold text-[#555]">Random</span>
                </label>
              </div>
            </div>

            {/* Single Type Selector - shown only in Single mode */}
            {servoTypeMode === 'single' && servoConfig.servos.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-[#aaa] uppercase">Servo Type</span>
                <select 
                  value={servoConfig.servos[0]?.servoType || 'AX-12A'}
                  onChange={(e) => updateServoType(0, e.target.value as ServoType)}
                  className="w-full bg-white te-border rounded-sm py-1.5 px-2 text-[11px] font-bold focus:outline-none"
                >
                  {SERVO_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {servoConfig.servos.map((s, idx) => (
                <div key={idx} className="bg-white te-border rounded-sm p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-[#aaa] uppercase">Servo {idx + 1}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveServoToTop(idx)}
                        disabled={idx === 0}
                        className={`px-1.5 py-0.5 text-[7px] font-black uppercase te-key ${
                          idx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:te-bg-orange hover:text-white'
                        }`}
                        title="Move to top"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveServoToBottom(idx)}
                        disabled={idx === servoConfig.servos.length - 1}
                        className={`px-1.5 py-0.5 text-[7px] font-black uppercase te-key ${
                          idx === servoConfig.servos.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:te-bg-orange hover:text-white'
                        }`}
                        title="Move to bottom"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => deleteServo(idx)}
                        disabled={servoConfig.servos.length <= 1}
                        className={`px-1.5 py-0.5 text-[7px] font-black uppercase te-key text-red-500 ${
                          servoConfig.servos.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-500 hover:text-white'
                        }`}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {/* Individual Type Selector - shown only in Multiple mode */}
                  {servoTypeMode === 'multiple' && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[7px] font-bold text-[#aaa] uppercase">Type</span>
                      <select 
                        value={s.servoType || 'AX-12A'}
                        onChange={(e) => updateServoType(idx, e.target.value as ServoType)}
                        className="w-full bg-[#f8f8f8] te-border rounded-sm py-1 px-1 text-[9px] font-bold focus:outline-none"
                      >
                        {SERVO_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-bold text-[#aaa] uppercase">Servo ID</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="253"
                      value={s.servoId || 1}
                      onChange={(e) => updateServoId(idx, parseInt(e.target.value) || 1)}
                      disabled={servoIdMode === 'incremental'}
                      className={`w-full bg-[#f8f8f8] te-border text-center rounded-sm py-1 text-[9px] font-bold ${
                        servoIdMode === 'incremental' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-bold text-[#aaa] uppercase">Active ID</span>
                    <div className="w-full bg-[#f0f0f0] te-border text-center rounded-sm py-1 text-[9px] font-bold opacity-50 cursor-not-allowed">
                      {s.id.toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-bold text-[#aaa] uppercase">Active ID Chain</span>
              <div className="grid grid-cols-4 gap-1">
                {servoConfig.servos.map((s, idx) => {
                  const isActive = s.active ?? true; // Default to true if not set
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleServoActive(idx)}
                      className={`te-border text-[9px] font-bold p-1 text-center rounded-sm transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                          : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                      }`}
                      title={isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                    >
                      {s.id.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
};

export default Sidebar;
