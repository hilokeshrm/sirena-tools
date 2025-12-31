
import React, { useState, useRef, useEffect } from 'react';
import { Skill, SkillFrame, IndividualServoState, isMXServo, getMaxAngle } from '../types';

interface DraggableFrameProps {
  frame: SkillFrame;
  index: number;
  isSelected: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

const DraggableFrame: React.FC<DraggableFrameProps> = ({
  frame,
  index,
  isSelected,
  isPlaying,
  onClick,
  onDuplicate,
  onDelete,
  onMove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div 
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
      }}
      onDragEnd={() => {
        setIsDragging(false);
        setDragOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (fromIndex !== index) {
          onMove(fromIndex, index);
        }
      }}
      onClick={onClick}
      className={`w-28 shrink-0 te-border rounded-md relative flex flex-col transition-all cursor-move group ${
        isSelected ? 'bg-white shadow-lg ring-1 ring-[#ff4d00]' : 'bg-[#fafafa] hover:bg-white'
      } ${isPlaying ? 'border-b-4 border-b-[#ff4d00]' : ''} ${
        isDragging ? 'opacity-50' : ''
      } ${dragOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="p-2 border-b border-[#f0f0f0] flex justify-between items-center">
        <span className="text-[8px] font-black text-[#ccc]">{index + 1}</span>
        <span className="text-[7px] mono text-[#aaa]">{frame.duration + frame.hold}ms</span>
      </div>
      
      {/* Mini Visualizer (Abstract representation of servo pose) */}
      <div className="flex-1 p-2 flex items-center justify-center gap-0.5 overflow-hidden">
        {frame.servos.map((s, i) => (
          <div 
            key={i} 
            className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-[#ff4d00]' : 'bg-[#aaa]'}`}
            style={{ height: `${Math.max(4, (s.angle / 360) * 100)}%`, opacity: 0.4 + ((s.angle/360) * 0.6) }}
          />
        ))}
      </div>

      {isPlaying && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#ff4d00] rounded-full shadow-sm animate-bounce" />
      )}
      
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="w-5 h-5 bg-white te-border rounded-full flex items-center justify-center text-[10px] text-blue-500 hover:bg-blue-50"
          title="Duplicate Frame"
        >
          ⧉
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-5 h-5 bg-white te-border rounded-full flex items-center justify-center text-[10px] text-red-500 hover:bg-red-50"
          title="Delete Frame"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface SkillsManagerProps {
  currentServos: IndividualServoState[];
  onExecuteFrame: (servos: IndividualServoState[]) => void;
  connected: boolean;
}

const SkillsManager: React.FC<SkillsManagerProps> = ({ currentServos, onExecuteFrame, connected }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playheadIndex, setPlayheadIndex] = useState(-1);
  const [playMode, setPlayMode] = useState<'all' | 'from-selected' | 'selected-only'>('all');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const createNewSkill = () => {
    const newSkill: Skill = {
      id: Math.random().toString(36).substr(2, 9),
      name: `NEW_SEQUENCE_${skills.length + 1}`,
      frames: [],
      createdAt: Date.now(),
      loop: false,
    };
    setSkills([...skills, newSkill]);
    setActiveSkill(newSkill);
  };

  const captureFrame = () => {
    if (!activeSkill) return;
    const newFrame: SkillFrame = {
      id: Math.random().toString(36).substr(2, 9),
      servos: JSON.parse(JSON.stringify(currentServos)),
      duration: 500,
      hold: 200,
    };
    const updatedSkill = { ...activeSkill, frames: [...activeSkill.frames, newFrame] };
    updateSkillInList(updatedSkill);
    setSelectedFrameId(newFrame.id);
  };

  const updateSkillInList = (updatedSkill: Skill) => {
    setSkills(prev => prev.map(s => s.id === updatedSkill.id ? updatedSkill : s));
    setActiveSkill(updatedSkill);
  };

  const deleteActiveSkill = () => {
    if (!activeSkill) return;
    if (confirm(`Are you sure you want to delete the whole skill "${activeSkill.name}"?`)) {
      setSkills(prev => prev.filter(s => s.id !== activeSkill.id));
      setActiveSkill(null);
      setSelectedFrameId(null);
    }
  };

  const deleteFrame = (frameId: string) => {
    if (!activeSkill) return;
    const updatedSkill = { ...activeSkill, frames: activeSkill.frames.filter(f => f.id !== frameId) };
    updateSkillInList(updatedSkill);
    if (selectedFrameId === frameId) setSelectedFrameId(null);
  };

  const updateFrameData = (frameId: string, updates: Partial<SkillFrame>) => {
    if (!activeSkill) return;
    const updatedSkill = {
      ...activeSkill,
      frames: activeSkill.frames.map(f => f.id === frameId ? { ...f, ...updates } : f)
    };
    updateSkillInList(updatedSkill);
  };

  const playSkill = async () => {
    if (!activeSkill || isPlaying || !connected) return;
    setIsPlaying(true);
    setIsPaused(false);
    
    // Determine start index based on play mode
    let startIndex = 0;
    if (playMode === 'from-selected' || playMode === 'selected-only') {
      const selectedIndex = activeSkill.frames.findIndex(f => f.id === selectedFrameId);
      if (selectedIndex >= 0) {
        startIndex = selectedIndex;
      }
    }
    
    // Determine end index
    const endIndex = playMode === 'selected-only' ? startIndex + 1 : activeSkill.frames.length;
    
    const run = async () => {
      for (let i = startIndex; i < endIndex; i++) {
        if (!isPlayingRef.current) break;
        
        // Wait if paused
        while (isPausedRef.current && isPlayingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (!isPlayingRef.current) break;
        
        setPlayheadIndex(i);
        const frame = activeSkill.frames[i];
        
        // Only send commands to active servos
        const activeServos = frame.servos.filter(s => s.active ?? true);
        if (activeServos.length > 0) {
          onExecuteFrame(activeServos);
        }
        
        // Duration is movement time, Hold is dwell time (adjusted by speed)
        const adjustedDuration = (frame.duration + frame.hold) / playbackSpeed;
        await new Promise(resolve => setTimeout(resolve, adjustedDuration));
      }
      
      if (activeSkill.loop && isPlayingRef.current && playMode !== 'selected-only') {
        run();
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setPlayheadIndex(-1);
      }
    };

    run();
  };

  const pauseSkill = () => {
    setIsPaused(true);
  };

  const resumeSkill = () => {
    setIsPaused(false);
  };

  const stopSkill = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setPlayheadIndex(-1);
  };

  const stepFrame = (direction: 'prev' | 'next') => {
    if (!activeSkill || activeSkill.frames.length === 0) return;
    const currentIndex = selectedFrameId 
      ? activeSkill.frames.findIndex(f => f.id === selectedFrameId)
      : -1;
    
    let newIndex = currentIndex;
    if (direction === 'next') {
      newIndex = currentIndex < activeSkill.frames.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : activeSkill.frames.length - 1;
    }
    
    const newFrame = activeSkill.frames[newIndex];
    setSelectedFrameId(newFrame.id);
    if (connected) {
      // Only send commands to active servos
      const activeServos = newFrame.servos.filter(s => s.active ?? true);
      if (activeServos.length > 0) {
        onExecuteFrame(activeServos);
      }
    }
  };

  const handleFrameClick = (frame: SkillFrame, index: number) => {
    setSelectedFrameId(frame.id);
    if (connected) {
      // Only send commands to active servos
      const activeServos = frame.servos.filter(s => s.active ?? true);
      if (activeServos.length > 0) {
        onExecuteFrame(activeServos);
      }
    }
  };

  const duplicateFrame = (frameId: string) => {
    if (!activeSkill) return;
    const frameIndex = activeSkill.frames.findIndex(f => f.id === frameId);
    if (frameIndex === -1) return;
    
    const frameToDuplicate = activeSkill.frames[frameIndex];
    const newFrame: SkillFrame = {
      id: Math.random().toString(36).substr(2, 9),
      servos: JSON.parse(JSON.stringify(frameToDuplicate.servos)),
      duration: frameToDuplicate.duration,
      hold: frameToDuplicate.hold,
    };
    
    const newFrames = [...activeSkill.frames];
    newFrames.splice(frameIndex + 1, 0, newFrame);
    const updatedSkill = { ...activeSkill, frames: newFrames };
    updateSkillInList(updatedSkill);
    setSelectedFrameId(newFrame.id);
  };

  const moveFrame = (fromIndex: number, toIndex: number) => {
    if (!activeSkill) return;
    const newFrames = [...activeSkill.frames];
    const [moved] = newFrames.splice(fromIndex, 1);
    newFrames.splice(toIndex, 0, moved);
    const updatedSkill = { ...activeSkill, frames: newFrames };
    updateSkillInList(updatedSkill);
  };

  const selectedFrame = activeSkill?.frames.find(f => f.id === selectedFrameId);

  const exportSkills = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skills, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ls6_skills_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importSkills = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setSkills(imported);
          if (imported.length > 0) setActiveSkill(imported[0]);
        } else {
          // Single skill import?
          setSkills([...skills, imported]);
          setActiveSkill(imported);
        }
      } catch (err) { alert("Invalid Sequence File"); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f0f0]">
      {/* Sequencer Toolbar */}
      <div className="bg-white border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-[#aaa] uppercase tracking-widest">Sequencer</span>
            <div className="flex items-center gap-2">
              <select 
                className="bg-transparent font-black tracking-tight text-[11px] focus:outline-none uppercase min-w-[120px]"
                value={activeSkill?.id || ''}
                onChange={(e) => setActiveSkill(skills.find(s => s.id === e.target.value) || null)}
              >
                <option value="" disabled>Select Sequence</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="h-6 w-px bg-[#eee]"></div>

          <div className="flex gap-2">
            <button onClick={createNewSkill} className="te-key px-3 py-1 text-[9px] font-black uppercase">New Skill</button>
            <button onClick={exportSkills} className="te-key px-3 py-1 text-[9px] font-black uppercase">Save JSON</button>
            <button onClick={() => fileInputRef.current?.click()} className="te-key px-3 py-1 text-[9px] font-black uppercase">Load File</button>
            <input type="file" ref={fileInputRef} onChange={importSkills} className="hidden" accept=".json,.txt" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-black text-[#aaa] uppercase">Play Mode:</span>
            <select 
              value={playMode}
              onChange={(e) => setPlayMode(e.target.value as 'all' | 'from-selected' | 'selected-only')}
              disabled={isPlaying}
              className="bg-white te-border rounded-sm py-1 px-2 text-[8px] font-bold focus:outline-none"
            >
              <option value="all">All Frames</option>
              <option value="from-selected">From Selected</option>
              <option value="selected-only">Selected Only</option>
            </select>
          </div>
          
          <div className="h-6 w-px bg-[#eee]"></div>
          
          <div className="flex gap-1">
            <button 
              onClick={() => stepFrame('prev')}
              disabled={!activeSkill || activeSkill.frames.length === 0 || !connected}
              className="px-2 py-1 te-key text-[9px] font-black uppercase"
              title="Previous Frame"
            >
              ◀
            </button>
            <button 
              onClick={() => stepFrame('next')}
              disabled={!activeSkill || activeSkill.frames.length === 0 || !connected}
              className="px-2 py-1 te-key text-[9px] font-black uppercase"
              title="Next Frame"
            >
              ▶
            </button>
          </div>
          
          <div className="h-6 w-px bg-[#eee]"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-black text-[#aaa] uppercase">Speed:</span>
            <input 
              type="number" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Math.max(0.1, Math.min(5, parseFloat(e.target.value) || 1)))}
              disabled={isPlaying}
              className="w-12 bg-white te-border text-center rounded-sm py-0.5 text-[8px] font-bold focus:outline-none"
            />
            <span className="text-[8px] font-bold text-[#888]">x</span>
          </div>
          
          <div className="h-6 w-px bg-[#eee]"></div>
          
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={activeSkill?.loop || false} 
              onChange={(e) => activeSkill && updateSkillInList({ ...activeSkill, loop: e.target.checked })}
              disabled={isPlaying}
              className="w-3 h-3 accent-[#ff4d00]"
            />
            <span className="text-[9px] font-black uppercase text-[#888]">Loop</span>
          </label>
          <button 
            onClick={isPlaying ? (isPaused ? resumeSkill : pauseSkill) : playSkill}
            disabled={!activeSkill || activeSkill.frames.length === 0 || !connected}
            className={`px-6 py-1 rounded te-key text-[10px] font-black uppercase tracking-widest transition-all ${
              isPlaying 
                ? (isPaused ? 'text-yellow-600 ring-1 ring-yellow-200' : 'text-red-500 ring-1 ring-red-200')
                : 'text-emerald-600'
            }`}
          >
            {isPlaying ? (isPaused ? '▶ Resume' : '⏸ Pause') : '▶ Play'}
          </button>
          {isPlaying && (
            <button 
              onClick={stopSkill}
              disabled={!activeSkill || !connected}
              className="px-4 py-1 rounded te-key text-[10px] font-black uppercase tracking-widest text-red-600"
            >
              ■ Stop
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeSkill ? (
          <>
            {/* Timeline View */}
            <div className="h-44 bg-[#e8e8e8] border-b border-[#d1d1d1] overflow-x-auto overflow-y-hidden p-4 flex gap-2 scroll-smooth">
              {activeSkill.frames.map((frame, index) => (
                <DraggableFrame
                  key={frame.id}
                  frame={frame}
                  index={index}
                  isSelected={selectedFrameId === frame.id}
                  isPlaying={playheadIndex === index}
                  onClick={() => handleFrameClick(frame, index)}
                  onDuplicate={() => duplicateFrame(frame.id)}
                  onDelete={() => deleteFrame(frame.id)}
                  onMove={(fromIndex, toIndex) => moveFrame(fromIndex, toIndex)}
                />
              ))}
              
              <button 
                onClick={captureFrame}
                className="w-28 shrink-0 border-2 border-dashed border-[#d1d1d1] rounded-md flex flex-col items-center justify-center gap-2 hover:border-[#ff4d00] hover:bg-white transition-all text-[#aaa] hover:text-[#ff4d00] bg-[#f5f5f5]"
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl leading-none">⏺</span>
                  <span className="text-[8px] font-black uppercase mt-1">Record Frame</span>
                </div>
              </button>
            </div>

            {/* Inspector / Frame Editor */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
               {selectedFrame ? (
                 <div className="flex flex-col h-full">
                    <div className="bg-[#f8f8f8] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center shrink-0">
                       <div className="flex gap-4 items-center">
                          <span className="text-[9px] font-black uppercase text-[#555]">Step {activeSkill.frames.indexOf(selectedFrame) + 1} Parameters</span>
                          
                          <div className="h-4 w-px bg-[#ddd]"></div>
                          
                          <div className="flex gap-3">
                             <div className="flex flex-col">
                                <span className="text-[6px] font-black text-[#aaa] uppercase tracking-tighter">Travel Speed (ms)</span>
                                <input 
                                  type="number" 
                                  value={selectedFrame.duration} 
                                  onChange={(e) => updateFrameData(selectedFrame.id, { duration: parseInt(e.target.value) || 0 })}
                                  className="w-16 bg-white te-border text-[10px] mono px-1 rounded focus:ring-1 focus:ring-[#ff4d00] outline-none"
                                />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[6px] font-black text-[#aaa] uppercase tracking-tighter">Dwell Time (ms)</span>
                                <input 
                                  type="number" 
                                  value={selectedFrame.hold} 
                                  onChange={(e) => updateFrameData(selectedFrame.id, { hold: parseInt(e.target.value) || 0 })}
                                  className="w-16 bg-white te-border text-[10px] mono px-1 rounded focus:ring-1 focus:ring-[#ff4d00] outline-none"
                                />
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => deleteFrame(selectedFrame.id)}
                            className="px-3 py-1 te-key text-[9px] font-black uppercase text-red-500"
                          >
                            Delete Step
                          </button>
                          <button 
                            onClick={deleteActiveSkill}
                            className="px-3 py-1 te-key text-[9px] font-black uppercase text-red-700 bg-red-50"
                          >
                            Wipe Entire Skill
                          </button>
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-[#fcfcfc]">
                       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {selectedFrame.servos.map((s, sIdx) => {
                            const angleMode = s.angleMode || (isMXServo(s.servoType) ? '360' : undefined);
                            const maxAngle = getMaxAngle(s.servoType, angleMode);
                            return (
                            <div key={sIdx} className="bg-white te-border rounded p-3 flex flex-col gap-2 shadow-sm hover:border-[#ff4d00] transition-colors">
                               <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-black text-[#aaa] uppercase">ID {s.id.toString().padStart(2, '0')}</span>
                                  <input 
                                    type="number" 
                                    value={s.angle}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(maxAngle, parseInt(e.target.value) || 0));
                                      const newServos = [...selectedFrame.servos];
                                      newServos[sIdx] = { ...newServos[sIdx], angle: val };
                                      updateFrameData(selectedFrame.id, { servos: newServos });
                                      if (connected) {
                                        // Only send commands to active servos
                                        const activeServos = newServos.filter(servo => servo.active ?? true);
                                        if (activeServos.length > 0) {
                                          onExecuteFrame(activeServos);
                                        }
                                      }
                                    }}
                                    className="text-[10px] mono font-bold text-right w-10 focus:outline-none"
                                  />
                               </div>
                               <input 
                                 type="range" min="0" max={maxAngle} 
                                 value={s.angle}
                                 onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    const newServos = [...selectedFrame.servos];
                                    newServos[sIdx] = { ...newServos[sIdx], angle: val };
                                    updateFrameData(selectedFrame.id, { servos: newServos });
                                    if (connected) {
                                      // Only send commands to active servos
                                      const activeServos = newServos.filter(servo => servo.active ?? true);
                                      if (activeServos.length > 0) {
                                        onExecuteFrame(activeServos);
                                      }
                                    }
                                 }}
                                 className="w-full h-1 bg-[#eee] appearance-none accent-[#ff4d00] cursor-pointer"
                               />
                               <div className="flex justify-between text-[7px] text-[#ccc] font-bold">
                                  <span>0°</span>
                                  <span>{maxAngle}°</span>
                               </div>
                            </div>
                            );
                          })}
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-[#ccc] bg-[#f9f9f9]">
                    <div className="text-4xl mb-3 opacity-20">🎞</div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Timeline Sequencer Active</p>
                    <p className="text-[8px] font-bold uppercase text-[#ddd] mt-1 tracking-widest">Select a frame to adjust pose and timing</p>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] p-12 text-center">
             <div className="w-16 h-16 rounded-full bg-white te-border flex items-center justify-center mb-6 text-2xl shadow-sm">
               🗂
             </div>
             <h2 className="text-2xl font-black tracking-tighter mb-2 uppercase">No sequence in buffer</h2>
             <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-10 max-w-sm">
                Create a new movement sequence or import a previously saved field skill file to begin playback.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={createNewSkill}
                 className="te-key px-8 py-3 text-[11px] font-black uppercase tracking-widest text-[#ff4d00]"
               >
                 + Create New Skill
               </button>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="te-key px-8 py-3 text-[11px] font-black uppercase tracking-widest text-[#1a1a1a]"
               >
                 Import Skill
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsManager;
