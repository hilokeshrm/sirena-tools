
import React, { useState, useRef } from 'react';
import { IndividualServoState, angleToPosition, CommandFormat, ServoConfig, ServoType, isMXServo, getCenterAngle } from '../types';

interface SkillFrameData {
  frame: number;
  speed: number;
  delay: number;
  base: number;
  servo1: number;
  servo2: number;
  servo3: number;
  servo4: number;
  servo5: number;
  servo6: number;
  servo7: number;
}

interface SkillsTableProps {
  currentServos: IndividualServoState[];
  onExecuteFrame: (servos: IndividualServoState[]) => Promise<void>;
  connected: boolean;
  commandFormat: CommandFormat;
  servoConfig?: ServoConfig;
  onServoConfigChange?: (config: ServoConfig) => void;
}

const SkillsTable: React.FC<SkillsTableProps> = ({
  currentServos,
  onExecuteFrame,
  connected,
  commandFormat,
  servoConfig,
  onServoConfigChange,
}) => {
  const [frames, setFrames] = useState<SkillFrameData[]>([
    { frame: 1, speed: 2.0, delay: 1.0, base: 180.0, servo1: 180.0, servo2: 180.0, servo3: 180.0, servo4: 180.0, servo5: 180.0, servo6: 180.0, servo7: 180.0 },
    { frame: 2, speed: 2.0, delay: 1.0, base: 273.0, servo1: 180.0, servo2: 180.0, servo3: 180.0, servo4: 180.0, servo5: 180.0, servo6: 180.0, servo7: 180.0 },
    { frame: 3, speed: 2.0, delay: 1.0, base: 273.0, servo1: 180.0, servo2: 180.0, servo3: 180.0, servo4: 237.0, servo5: 220.0, servo6: 213.0, servo7: 180.0 },
    { frame: 4, speed: 2.0, delay: 1.0, base: 273.0, servo1: 180.0, servo2: 180.0, servo3: 205.0, servo4: 224.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 5, speed: 2.0, delay: 1.0, base: 273.0, servo1: 180.0, servo2: 199.0, servo3: 205.0, servo4: 224.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 6, speed: 2.0, delay: 1.0, base: 273.0, servo1: 189.0, servo2: 199.0, servo3: 205.0, servo4: 224.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 7, speed: 2.0, delay: 1.0, base: 273.0, servo1: 182.0, servo2: 199.0, servo3: 205.0, servo4: 224.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 8, speed: 2.0, delay: 1.0, base: 273.0, servo1: 170.0, servo2: 188.0, servo3: 205.0, servo4: 224.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 9, speed: 2.0, delay: 1.0, base: 273.0, servo1: 170.0, servo2: 188.0, servo3: 174.0, servo4: 224.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 10, speed: 2.0, delay: 1.0, base: 273.0, servo1: 170.0, servo2: 188.0, servo3: 174.0, servo4: 197.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 11, speed: 2.0, delay: 1.0, base: 186.0, servo1: 170.0, servo2: 188.0, servo3: 174.0, servo4: 197.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 12, speed: 5.0, delay: 1.0, base: 186.0, servo1: 170.0, servo2: 188.0, servo3: 225.0, servo4: 233.0, servo5: 201.0, servo6: 216.0, servo7: 187.0 },
    { frame: 13, speed: 5.0, delay: 1.0, base: 180.0, servo1: 180.0, servo2: 180.0, servo3: 180.0, servo4: 180.0, servo5: 180.0, servo6: 180.0, servo7: 180.0 },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(-1);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedFrame, setCopiedFrame] = useState<SkillFrameData | null>(null);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  React.useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const convertFrameToServos = (frameData: SkillFrameData): IndividualServoState[] => {
    // Map table values to servo states
    // Base (P) maps to servo index 0, Servo1-7 map to servo indices 1-7
    // We need to create 8 servos total (Base + 7 servos)
    const servos: IndividualServoState[] = [];
    const velocity = Math.round(frameData.speed * 128);
    
    // Get default servo type from first configured servo, or use AX-12A
    const defaultServoType = currentServos.length > 0 ? currentServos[0].servoType : 'AX-12A';
    
    // Map Base (P) to first servo (index 0, servoId 1)
    const baseServo = currentServos.length > 0 
      ? { ...currentServos[0] }
      : {
          id: 0,
          servoId: 1,
          servoType: defaultServoType,
          angle: 180,
          velocity: 256,
          active: true,
        };
    servos.push({
      ...baseServo,
      angle: frameData.base,
      velocity: velocity,
      active: true, // Ensure it's active
    });

    // Servo1-7 map to servos 1-7 (indices 1-7, servoIds 2-8)
    const servoValues = [
      frameData.servo1,
      frameData.servo2,
      frameData.servo3,
      frameData.servo4,
      frameData.servo5,
      frameData.servo6,
      frameData.servo7,
    ];

    // Map Servo1-7 to servos 1-7 (up to 8 servos total: Base + 7 servos)
    for (let i = 0; i < servoValues.length; i++) {
      const servoIndex = i + 1; // Servo1 -> index 1, Servo2 -> index 2, etc.
      const servoId = i + 2; // Servo1 -> servoId 2, Servo2 -> servoId 3, etc.
      
      // Use existing servo config if available, otherwise create default
      const existingServo = servoIndex < currentServos.length ? currentServos[servoIndex] : null;
      const servo = existingServo || {
        id: servoId - 1, // Active ID = servoId - 1
        servoId: servoId,
        servoType: defaultServoType,
        angle: 180,
        velocity: 256,
        active: true,
      };
      
      servos.push({
        ...servo,
        angle: servoValues[i],
        velocity: velocity,
        active: true, // Ensure it's active
      });
    }

    // If we have more servos configured than the 8 we're mapping, keep them at their current state
    for (let i = servos.length; i < currentServos.length; i++) {
      servos.push({ ...currentServos[i], active: currentServos[i].active ?? true });
    }

    return servos;
  };

  const playFrame = async (frameIndex: number) => {
    if (!connected || frameIndex < 0 || frameIndex >= frames.length) {
      console.log('Play frame blocked:', { connected, frameIndex, framesLength: frames.length });
      return;
    }
    
    const frameData = frames[frameIndex];
    const servos = convertFrameToServos(frameData);
    console.log('Playing frame:', frameIndex, 'Servos:', servos.length, servos);
    await onExecuteFrame(servos);
  };

  const playAllFrames = async () => {
    if (!connected || isPlaying || frames.length === 0) return;
    
    setIsPlaying(true);
    setIsPaused(false);
    
    const run = async () => {
      for (let i = 0; i < frames.length; i++) {
        if (!isPlayingRef.current) break;
        
        // Wait if paused
        while (isPausedRef.current && isPlayingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (!isPlayingRef.current) break;
        
        setCurrentFrameIndex(i);
        const frameData = frames[i];
        const servos = convertFrameToServos(frameData);
        
        // Send the frame command to servos
        await onExecuteFrame(servos);
        
        // Wait for delay time (in seconds) before moving to next frame
        // Example: delay = 2 means wait 2 seconds after this frame before next frame
        // Skip delay for the last frame (no need to wait after the final frame)
        if (i < frames.length - 1) {
          const delayMs = frameData.delay * 1000; // Convert seconds to milliseconds
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentFrameIndex(-1);
    };

    run();
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentFrameIndex(-1);
  };

  const pausePlayback = () => {
    setIsPaused(true);
  };

  const resumePlayback = () => {
    setIsPaused(false);
  };

  const updateFrame = (frameIndex: number, field: keyof SkillFrameData, value: number) => {
    const newFrames = [...frames];
    newFrames[frameIndex] = { ...newFrames[frameIndex], [field]: value };
    setFrames(newFrames);
  };

  const addFrame = () => {
    const newFrame: SkillFrameData = {
      frame: frames.length + 1,
      speed: 2.0,
      delay: 1.0,
      base: 180.0,
      servo1: 180.0,
      servo2: 180.0,
      servo3: 180.0,
      servo4: 180.0,
      servo5: 180.0,
      servo6: 180.0,
      servo7: 180.0,
    };
    setFrames([...frames, newFrame]);
  };

  const deleteFrame = (frameIndex: number) => {
    if (frames.length <= 1) {
      alert('Cannot delete the last frame. At least one frame is required.');
      return;
    }
    const newFrames = frames.filter((_, idx) => idx !== frameIndex);
    // Re-number frames
    const renumberedFrames = newFrames.map((f, idx) => ({ ...f, frame: idx + 1 }));
    setFrames(renumberedFrames);
  };

  const saveTable = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(frames, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `skills_table_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMenuOpen(false);
  };

  const exportCSV = () => {
    const headers = ['Frame', 'Speed', 'Delay', 'Base (P)', 'Servo1', 'Servo2', 'Servo3', 'Servo4', 'Servo5', 'Servo6', 'Servo7'];
    const csvRows = [
      headers.join(','),
      ...frames.map(frame => [
        frame.frame,
        frame.speed,
        frame.delay,
        frame.base,
        frame.servo1,
        frame.servo2,
        frame.servo3,
        frame.servo4,
        frame.servo5,
        frame.servo6,
        frame.servo7,
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `skills_table_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    window.URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const clearTable = () => {
    if (confirm('Are you sure you want to clear all frames? This cannot be undone.')) {
      const defaultFrame: SkillFrameData = {
        frame: 1,
        speed: 2.0,
        delay: 1.0,
        base: 180.0,
        servo1: 180.0,
        servo2: 180.0,
        servo3: 180.0,
        servo4: 180.0,
        servo5: 180.0,
        servo6: 180.0,
        servo7: 180.0,
      };
      setFrames([defaultFrame]);
      setMenuOpen(false);
    }
  };

  const duplicateFrame = (frameIndex: number) => {
    const frameToDuplicate = frames[frameIndex];
    const newFrame: SkillFrameData = {
      ...frameToDuplicate,
      frame: frames.length + 1,
    };
    const newFrames = [...frames];
    newFrames.splice(frameIndex + 1, 0, newFrame);
    const renumberedFrames = newFrames.map((f, idx) => ({ ...f, frame: idx + 1 }));
    setFrames(renumberedFrames);
  };

  const copyFrame = (frameIndex: number) => {
    setCopiedFrame({ ...frames[frameIndex] });
  };

  const pasteFrame = (frameIndex: number) => {
    if (copiedFrame) {
      const newFrames = [...frames];
      newFrames[frameIndex] = { ...copiedFrame, frame: frameIndex + 1 };
      setFrames(newFrames);
    }
  };

  const configureServosForSkill = () => {
    // Skills table needs 8 servos: Base (P) + Servo1-7
    const requiredServoCount = 8;
    
    if (!servoConfig || !onServoConfigChange) return;
    
    // Get base servo type from existing config or default to AX-12A
    const baseServoType: ServoType = currentServos.length > 0 
      ? currentServos[0].servoType 
      : 'AX-12A';
    
    // If we already have the right number of servos, just ensure they're configured correctly
    if (servoConfig.servos.length === requiredServoCount) {
      // Servos already configured, no need to change
      return;
    }
    
    // Create 8 servos with incremental IDs (1-8)
    const newServos: IndividualServoState[] = [];
    const newIds: number[] = [];
    
    for (let i = 0; i < requiredServoCount; i++) {
      const defaultAngle = isMXServo(baseServoType) ? getCenterAngle(baseServoType, '360') : 150;
      newServos.push({
        id: i, // Active ID (0-based)
        servoId: i + 1, // Physical Servo ID (1-based): 1, 2, 3, ..., 8
        servoType: baseServoType,
        angle: defaultAngle,
        velocity: 256,
        active: true,
        angleMode: isMXServo(baseServoType) ? '360' : undefined
      });
      newIds.push(i + 1);
    }
    
    // Update servo configuration
    onServoConfigChange({
      ...servoConfig,
      numServos: requiredServoCount,
      servoIds: newIds,
      servos: newServos
    });
  };

  const loadTable = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported) && imported.length > 0) {
          // Validate structure
          const isValid = imported.every((frame: any) => 
            frame.frame !== undefined &&
            frame.speed !== undefined &&
            frame.delay !== undefined &&
            frame.base !== undefined &&
            frame.servo1 !== undefined &&
            frame.servo2 !== undefined &&
            frame.servo3 !== undefined &&
            frame.servo4 !== undefined &&
            frame.servo5 !== undefined &&
            frame.servo6 !== undefined &&
            frame.servo7 !== undefined
          );
          if (isValid) {
            // Re-number frames to ensure continuity
            const renumberedFrames = imported.map((f: SkillFrameData, idx: number) => ({ ...f, frame: idx + 1 }));
            setFrames(renumberedFrames);
            
            // Automatically configure 8 servos for the skill table
            configureServosForSkill();
          } else {
            alert("Invalid table file format. Please ensure all frames have all required fields.");
          }
        } else {
          alert("Invalid table file. Expected an array of frames.");
        }
      } catch (err) {
        alert("Error loading table file. Please check the file format.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="bg-[#f8f8f8] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-[#555]">Skills Table</h2>
          <div className="h-4 w-px bg-[#ddd]"></div>
          <div className="flex gap-2">
            <button
              onClick={isPlaying ? (isPaused ? resumePlayback : pausePlayback) : playAllFrames}
              disabled={!connected || frames.length === 0}
              className={`px-4 py-1.5 te-key text-[9px] font-black uppercase tracking-widest ${
                isPlaying 
                  ? (isPaused ? 'text-yellow-600' : 'text-red-500')
                  : 'text-emerald-600'
              }`}
            >
              {isPlaying ? (isPaused ? '▶ Resume' : '⏸ Pause') : '▶ Play All'}
            </button>
            {isPlaying && (
              <button
                onClick={stopPlayback}
                disabled={!connected}
                className="px-4 py-1.5 te-key text-[9px] font-black uppercase tracking-widest text-red-600"
              >
                ■ Stop
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={isPlaying}
            className="px-3 py-1.5 te-key text-[9px] font-black uppercase tracking-widest text-[#1a1a1a] flex items-center gap-1"
          >
            ☰ Menu
            <span className={`text-[7px] transition-transform ${menuOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white te-border rounded-sm shadow-lg z-50 min-w-[180px] py-1">
              <div className="px-3 py-1.5 border-b border-[#f0f0f0]">
                <span className="text-[7px] font-black uppercase tracking-widest text-[#aaa]">File</span>
              </div>
              <button
                onClick={saveTable}
                disabled={isPlaying || frames.length === 0}
                className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
              >
                <span>💾</span>
                <span>Save as JSON</span>
              </button>
              <button
                onClick={exportCSV}
                disabled={isPlaying || frames.length === 0}
                className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
              >
                <span>📊</span>
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setMenuOpen(false);
                }}
                disabled={isPlaying}
                className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
              >
                <span>📂</span>
                <span>Load from File</span>
              </button>
              <button
                onClick={clearTable}
                disabled={isPlaying}
                className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
              >
                <span>🗑</span>
                <span>Clear Table</span>
              </button>
              
              <div className="px-3 py-1.5 border-t border-[#f0f0f0] mt-1">
                <span className="text-[7px] font-black uppercase tracking-widest text-[#aaa]">Frames</span>
              </div>
              <button
                onClick={() => {
                  addFrame();
                  setMenuOpen(false);
                }}
                disabled={isPlaying}
                className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                <span>Add Frame</span>
              </button>
              {selectedFrameIndex !== null && (
                <>
                  <button
                    onClick={() => {
                      duplicateFrame(selectedFrameIndex);
                      setMenuOpen(false);
                    }}
                    disabled={isPlaying}
                    className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
                  >
                    <span>📋</span>
                    <span>Duplicate Frame</span>
                  </button>
                  <button
                    onClick={() => {
                      copyFrame(selectedFrameIndex);
                      setMenuOpen(false);
                    }}
                    disabled={isPlaying}
                    className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
                  >
                    <span>📄</span>
                    <span>Copy Frame</span>
                  </button>
                  {copiedFrame && (
                    <button
                      onClick={() => {
                        pasteFrame(selectedFrameIndex);
                        setMenuOpen(false);
                      }}
                      disabled={isPlaying}
                      className="w-full text-left px-3 py-2 text-[9px] font-bold uppercase tracking-tight hover:bg-[#f8f8f8] transition-colors flex items-center gap-2"
                    >
                      <span>📥</span>
                      <span>Paste Frame</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={loadTable}
            className="hidden"
            accept=".json,.csv"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[9px] font-bold">
          <thead className="bg-[#f8f8f8] sticky top-0 z-10">
            <tr className="border-b border-[#d1d1d1]">
              <th className="px-3 py-2 text-left text-[8px] font-black uppercase tracking-widest text-[#aaa]">Frame</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Speed</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Delay</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Base (P)</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo1</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo2</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo3</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo4</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo5</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo6</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Servo7</th>
              <th className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-widest text-[#aaa]">Action</th>
            </tr>
          </thead>
          <tbody>
            {frames.map((frame, index) => (
              <tr
                key={frame.frame}
                onClick={() => setSelectedFrameIndex(index)}
                className={`border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors cursor-pointer ${
                  currentFrameIndex === index ? 'bg-[#fff4e6]' : ''
                } ${selectedFrameIndex === index ? 'bg-blue-50' : ''}`}
              >
                <td className="px-3 py-2 text-[10px] font-black mono">{frame.frame}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.speed}
                    onChange={(e) => updateFrame(index, 'speed', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.delay}
                    onChange={(e) => updateFrame(index, 'delay', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.base}
                    onChange={(e) => updateFrame(index, 'base', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo1}
                    onChange={(e) => updateFrame(index, 'servo1', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo2}
                    onChange={(e) => updateFrame(index, 'servo2', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo3}
                    onChange={(e) => updateFrame(index, 'servo3', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo4}
                    onChange={(e) => updateFrame(index, 'servo4', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo5}
                    onChange={(e) => updateFrame(index, 'servo5', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo6}
                    onChange={(e) => updateFrame(index, 'servo6', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={frame.servo7}
                    onChange={(e) => updateFrame(index, 'servo7', parseFloat(e.target.value) || 0)}
                    className="w-16 text-center bg-white te-border rounded-sm py-0.5 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                  />
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 items-center justify-center">
                    <button
                      onClick={() => playFrame(index)}
                      disabled={!connected || isPlaying}
                      className="px-2 py-1 te-key text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
                      title="Play Frame"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => {
                        duplicateFrame(index);
                      }}
                      disabled={isPlaying}
                      className="px-2 py-1 te-key text-[8px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                      title="Duplicate Frame"
                    >
                      ⧉
                    </button>
                    <button
                      onClick={() => deleteFrame(index)}
                      disabled={isPlaying || frames.length <= 1}
                      className="px-2 py-1 te-key text-[8px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50"
                      title="Delete Frame"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkillsTable;
