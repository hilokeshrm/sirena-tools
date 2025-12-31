
import React from 'react';
import { IndividualServoState, isMXServo, getMaxAngle, getCenterAngle, CommandFormat } from '../types';

interface ControlPanelProps {
  servos: IndividualServoState[];
  onUpdateServo: (index: number, updates: Partial<IndividualServoState>) => void;
  onSend: (index?: number) => void;
  connected: boolean;
  onInterrupt: () => void;
  commandFormat: CommandFormat;
  onCommandFormatChange: (format: CommandFormat) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  servos,
  onUpdateServo,
  onSend,
  connected,
  onInterrupt,
  commandFormat,
  onCommandFormatChange,
}) => {
  return (
    <div className="bg-[#f0f0f0] te-border rounded-lg p-4 flex flex-col gap-4 shadow-sm h-[420px]">
      <div className="flex flex-col gap-2 px-2">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#555]">02 Control Matrix</h2>
            <p className="text-[8px] font-bold text-[#aaa] uppercase">Individual Servo Parameter Mapping</p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => onSend()} 
               disabled={!connected}
               className="px-4 py-1.5 te-key text-[9px] font-black uppercase tracking-widest te-orange"
             >
               Broadcast All
             </button>
             <button 
               onClick={onInterrupt} 
               disabled={!connected}
               className="px-4 py-1.5 te-key text-[9px] font-black uppercase tracking-widest text-red-500"
             >
               Break
             </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-bold text-[#888] uppercase">Cmd Format:</span>
          <div className="flex gap-1">
            <button
              onClick={() => onCommandFormatChange('batch')}
              className={`text-[7px] font-black uppercase px-2 py-0.5 rounded te-border transition-all ${
                commandFormat === 'batch'
                  ? 'bg-[#ff4d00] text-white'
                  : 'bg-[#fafafa] text-[#888] hover:bg-white'
              }`}
              title="Batch: id1:id2:...:pos1:pos2:...:vel1:vel2:..."
            >
              Batch
            </button>
            <button
              onClick={() => onCommandFormatChange('interleaved')}
              className={`text-[7px] font-black uppercase px-2 py-0.5 rounded te-border transition-all ${
                commandFormat === 'interleaved'
                  ? 'bg-[#ff4d00] text-white'
                  : 'bg-[#fafafa] text-[#888] hover:bg-white'
              }`}
              title="Interleaved: id:pos:vel:id:pos:vel:..."
            >
              Interleaved
            </button>
            <button
              onClick={() => onCommandFormatChange('separate')}
              className={`text-[7px] font-black uppercase px-2 py-0.5 rounded te-border transition-all ${
                commandFormat === 'separate'
                  ? 'bg-[#ff4d00] text-white'
                  : 'bg-[#fafafa] text-[#888] hover:bg-white'
              }`}
              title="Separate: one command per servo"
            >
              Separate
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-3 pb-4">
        {servos.map((s, idx) => {
          const angleMode = s.angleMode || (isMXServo(s.servoType) ? '360' : undefined);
          const maxAngle = getMaxAngle(s.servoType, angleMode);
          const centerAngle = getCenterAngle(s.servoType, angleMode);
          // Calculate rotation: center angle is 0° rotation
          // Map angle to rotation: 0° → +center, center → 0°, max → -center
          const rotation = centerAngle - s.angle;
          
          return (
          <div key={idx} className="w-40 shrink-0 bg-white te-border rounded-lg flex flex-col p-2.5 shadow-inner">
             <div className="flex justify-between items-start mb-3">
                <div>
                   <span className="text-[7px] font-black text-[#aaa] uppercase">Servo Unit</span>
                   <h3 className="text-base font-black tracking-tighter mono">#{s.id.toString().padStart(2, '0')}</h3>
                   <div className="flex gap-1 mt-0.5">
                     <span className="text-[6px] font-bold text-[#aaa] uppercase">{s.servoType || 'AX-12A'}</span>
                     <span className="text-[6px] font-bold text-[#aaa]">ID:{s.servoId || 1}</span>
                   </div>
                </div>
                <button 
                  onClick={() => onSend(idx)}
                  disabled={!connected}
                  className="w-7 h-7 rounded-full te-border flex items-center justify-center text-[9px] hover:te-bg-orange hover:text-white transition-all relative"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  ↑
                </button>
             </div>

             <div className="flex-1 flex flex-col gap-5">
                {isMXServo(s.servoType) && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[6px] font-bold text-[#888] uppercase">Range:</span>
                    <button
                      onClick={() => {
                        if (angleMode === '300') return; // Already in 300 mode
                        // Convert angle when switching modes to maintain relative position
                        const currentPercent = s.angle / maxAngle;
                        const newMaxAngle = getMaxAngle(s.servoType, '300');
                        const newAngle = Math.round(currentPercent * newMaxAngle);
                        onUpdateServo(idx, { angleMode: '300', angle: newAngle });
                      }}
                      className={`text-[7px] font-black uppercase px-2 py-0.5 rounded te-border transition-all ${
                        angleMode === '300' 
                          ? 'bg-[#ff4d00] text-white' 
                          : 'bg-[#fafafa] text-[#888] hover:bg-white'
                      }`}
                    >
                      300°
                    </button>
                    <button
                      onClick={() => {
                        if (angleMode === '360') return; // Already in 360 mode
                        // Convert angle when switching modes to maintain relative position
                        const currentPercent = s.angle / maxAngle;
                        const newMaxAngle = getMaxAngle(s.servoType, '360');
                        const newAngle = Math.round(currentPercent * newMaxAngle);
                        onUpdateServo(idx, { angleMode: '360', angle: newAngle });
                      }}
                      className={`text-[7px] font-black uppercase px-2 py-0.5 rounded te-border transition-all ${
                        angleMode === '360' 
                          ? 'bg-[#ff4d00] text-white' 
                          : 'bg-[#fafafa] text-[#888] hover:bg-white'
                      }`}
                    >
                      360°
                    </button>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                   <div className="flex justify-between items-baseline">
                      <span className="text-[8px] font-bold text-[#888] uppercase">Angle</span>
                      <span className="text-[10px] font-black mono">{s.angle}°</span>
                   </div>
                   <input 
                      type="range" min="0" max={maxAngle} step="1"
                      value={s.angle}
                      onChange={(e) => onUpdateServo(idx, { angle: parseInt(e.target.value) })}
                      className="w-full h-1 bg-[#f0f0f0] rounded-full appearance-none cursor-pointer accent-[#ff4d00]"
                      style={{ transform: 'scaleX(-1)' }}
                   />
                </div>

                <div className="flex flex-col gap-2">
                   <div className="flex justify-between items-baseline">
                      <span className="text-[8px] font-bold text-[#888] uppercase">Velocity</span>
                      <span className="text-[10px] font-black mono">{s.velocity}</span>
                   </div>
                   <input 
                      type="range" min="0" max="1023" step="1"
                      value={s.velocity}
                      onChange={(e) => onUpdateServo(idx, { velocity: parseInt(e.target.value) })}
                      className="w-full h-1 bg-[#f0f0f0] rounded-full appearance-none cursor-pointer accent-[#1a1a1a]"
                   />
                </div>
                
                <div className="mt-auto grid grid-cols-2 gap-1">
                   <button 
                     onClick={() => onUpdateServo(idx, { angle: centerAngle })}
                     className="text-[7px] font-black uppercase p-1 te-border rounded bg-[#fafafa] hover:bg-white"
                   >
                     Reset
                   </button>
                   <button 
                     onClick={() => onUpdateServo(idx, { angle: 0 })}
                     className="text-[7px] font-black uppercase p-1 te-border rounded bg-[#fafafa] hover:bg-white"
                   >
                     Zero
                   </button>
                </div>
             </div>
          </div>
          );
        })}
        {/* Placeholder for adding more servos if count < 20 */}
        {servos.length < 20 && (
          <div className="w-12 shrink-0 flex items-center justify-center">
             <div className="w-px h-full bg-[#d1d1d1] opacity-30"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
