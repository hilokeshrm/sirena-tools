
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogEntry, ServoConfig, SerialStatus, IndividualServoState, angleToPosition, CommandFormat } from './types';
import LogViewer from './components/LogViewer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import CommandBar from './components/CommandBar';
import Sidebar from './components/Sidebar';
import SkillsManager from './components/SkillsManager';

const App: React.FC = () => {
  const [port, setPort] = useState<any>(null);
  const [status, setStatus] = useState<SerialStatus>({ connected: false });
  const [baudRate, setBaudRate] = useState<number>(57600);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [viewMode, setViewMode] = useState<'monitor' | 'skills'>('monitor');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [commandFormat, setCommandFormat] = useState<CommandFormat>('batch');
  
  const [servoConfig, setServoConfig] = useState<ServoConfig>({
    numServos: 1,
    servoIds: [1],
    baudRate: 57600,
    servos: [{ id: 0, servoId: 1, servoType: 'AX-12A', angle: 150, velocity: 256, active: true }]
  });

  const readerRef = useRef<any>(null);
  const logsRef = useRef<LogEntry[]>([]);
  const isReadingRef = useRef<boolean>(false);
  const portRef = useRef<any>(null);

  useEffect(() => {
    portRef.current = port;
  }, [port]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'rx') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      type,
    };
    logsRef.current = [...logsRef.current.slice(-1999), newLog];
    setLogs([...logsRef.current]);
  }, []);


  const updateServoState = (index: number, updates: Partial<IndividualServoState>) => {
    const newServos = [...servoConfig.servos];
    newServos[index] = { ...newServos[index], ...updates };
    setServoConfig(prev => ({ ...prev, servos: newServos }));
  };

  const sendInterrupt = useCallback(async () => {
    const activePort = portRef.current;
    if (!activePort || !activePort.writable) return;
    const writer = activePort.writable.getWriter();
    try {
      await writer.write(new Uint8Array([0x03]));
      addLog(`SIGNAL: BREAK (0x03) SENT`, 'tx');
    } catch (err) {
      addLog(`SIGNAL ERR: ${err}`, 'error');
    } finally {
      writer.releaseLock();
    }
  }, [addLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 0) return;
        if (status.connected) {
          e.preventDefault();
          sendInterrupt();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status.connected, sendInterrupt]);

  const connect = async () => {
    try {
      const selectedPort = await (navigator as any).serial.requestPort();
      const activeBaudRate = servoConfig.baudRate || baudRate;
      await selectedPort.open({ baudRate: activeBaudRate });
      setPort(selectedPort);
      setStatus({ connected: true, portName: "FIELD LINK ACTIVE" });
      addLog(`SYSTEM: Serial Link Established @ ${activeBaudRate} BPS`, 'info');
      startReading(selectedPort);
    } catch (err: any) {
      const errorMsg = err.message || "Connection Failed";
      setStatus({ connected: false, error: errorMsg });
      addLog(`ERROR: ${errorMsg}`, 'error');
    }
  };

  const disconnect = async () => {
    isReadingRef.current = false;
    if (readerRef.current) { try { await readerRef.current.cancel(); } catch (e) {} }
    if (port) { try { await port.close(); } catch (e) {} }
    setPort(null);
    setStatus({ connected: false });
    addLog(`SYSTEM: Serial Link Terminated`, 'info');
  };

  const startReading = async (activePort: any) => {
    isReadingRef.current = true;
    while (activePort.readable && isReadingRef.current) {
      const reader = activePort.readable.getReader();
      readerRef.current = reader;
      try {
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          lines.forEach(line => line.trim() && addLog(line.trim(), 'rx'));
        }
      } catch (err) {
        if (isReadingRef.current) addLog(`READ FAIL: ${err}`, 'error');
      } finally {
        reader.releaseLock();
      }
    }
  };

  const writeSerial = async (cmd: string) => {
    if (!port || !port.writable) return;
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    try {
      const formattedCmd = cmd.endsWith('\n') ? cmd : `${cmd}\n`;
      await writer.write(encoder.encode(formattedCmd));
      addLog(`${cmd.trim()}`, 'tx');
    } catch (err) {
      addLog(`WRITE FAIL: ${err}`, 'error');
    } finally {
      writer.releaseLock();
    }
  };

  const formatServoCommands = async (servos: IndividualServoState[], format: CommandFormat): Promise<void> => {
    const activeServos = servos.filter(s => s.active ?? true);
    if (activeServos.length === 0) return;

    switch (format) {
      case 'batch': {
        // Format: id1:id2:id3:...:position1:position2:position3:...:velocity1:velocity2:velocity3:...
        const ids = activeServos.map(s => s.id).join(':');
        const positions = activeServos.map(s => 
          angleToPosition(s.angle, s.servoType, s.angleMode)
        ).join(':');
        const velocities = activeServos.map(s => s.velocity).join(':');
        const cmd = `LUCI_local 245 SetServoPartial:${ids}:${positions}:${velocities}`;
        await writeSerial(cmd);
        break;
      }
      case 'interleaved': {
        // Format: id:position:velocity:id:position:velocity:id:position:velocity:...
        const parts = activeServos.map(s => {
          const pos = angleToPosition(s.angle, s.servoType, s.angleMode);
          return `${s.id}:${pos}:${s.velocity}`;
        });
        const cmd = `LUCI_local 245 SetServoPartial:${parts.join(':')}`;
        await writeSerial(cmd);
        break;
      }
      case 'separate': {
        // Format: separate commands, one per line - send all servos sequentially
        for (const s of activeServos) {
          const pos = angleToPosition(s.angle, s.servoType, s.angleMode);
          const cmd = `LUCI_local 245 SetServoPartial:${s.id}:${pos}:${s.velocity}`;
          await writeSerial(cmd);
          // Small delay between commands to ensure proper serial transmission
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        break;
      }
    }
  };

  const sendServoCommand = (index?: number) => {
    if (typeof index === 'number') {
      // Single servo command - always uses separate format for single servo
      const s = servoConfig.servos[index];
      if (!(s.active ?? true)) return; // Don't send if inactive
      const pos = angleToPosition(s.angle, s.servoType, s.angleMode);
      const cmd = `LUCI_local 245 SetServoPartial:${s.id}:${pos}:${s.velocity}`;
      writeSerial(cmd);
    } else {
      // Broadcast to all active servos using selected format
      formatServoCommands(servoConfig.servos, commandFormat);
    }
  };

  const executeSkillFrame = async (servos: IndividualServoState[]) => {
    // Update local state so UI reflects what's happening
    setServoConfig(prev => ({ ...prev, servos }));
    // Actually send to serial using selected format
    await formatServoCommands(servos, commandFormat);
  };

  return (
    <div className="flex h-screen w-screen bg-[#f0f0f0] text-[#1a1a1a] font-sans selection:bg-[#ff4d00]/20">
      <Sidebar 
        status={status}
        baudRate={servoConfig.baudRate || baudRate}
        onBaudChange={(val) => {
          setBaudRate(val);
          setServoConfig(prev => ({ ...prev, baudRate: val }));
        }}
        onConnect={connect}
        onDisconnect={disconnect}
        servoConfig={servoConfig}
        onServoConfigChange={setServoConfig}
      />

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ControlPanel 
              servos={servoConfig.servos}
              onUpdateServo={updateServoState}
              onSend={sendServoCommand}
              connected={status.connected}
              onInterrupt={sendInterrupt}
              commandFormat={commandFormat}
              onCommandFormatChange={setCommandFormat}
            />
            
            <div className="flex-1 flex flex-col bg-white te-border rounded-lg overflow-hidden relative min-h-0">
               <div className="bg-[#f8f8f8] border-b border-[#d1d1d1] px-3 py-1 flex justify-between items-center shrink-0 gap-3">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setViewMode('monitor')}
                      className={`text-[9px] font-black uppercase tracking-widest py-1 border-b-2 transition-all ${viewMode === 'monitor' ? 'border-[#ff4d00] text-[#1a1a1a]' : 'border-transparent text-[#aaa]'}`}
                    >
                      Monitor
                    </button>
                    {/* <button 
                      onClick={() => setViewMode('skills')}
                      className={`text-[9px] font-black uppercase tracking-widest py-1 border-b-2 transition-all ${viewMode === 'skills' ? 'border-[#ff4d00] text-[#1a1a1a]' : 'border-transparent text-[#aaa]'}`}
                    >
                      Skills
                    </button> */}
                  </div>
                  {viewMode === 'monitor' && (
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-white te-border rounded-sm py-1 px-2 text-[9px] font-bold focus:outline-none focus:ring-1 focus:ring-[#ff4d00]"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-[8px] font-bold uppercase text-[#aaa] hover:text-red-500 px-2"
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                  {viewMode === 'monitor' && (
                    <button onClick={() => { logsRef.current = []; setLogs([]); }} className="text-[8px] font-bold uppercase text-[#aaa] hover:text-red-500">Flush</button>
                  )}
               </div>
               
               {viewMode === 'monitor' ? (
                 <LogViewer logs={logs.filter(log => 
                   searchTerm === '' || 
                   log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   log.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   log.type.toLowerCase().includes(searchTerm.toLowerCase())
                 )} />
               ) : (
                 <SkillsManager 
                    currentServos={servoConfig.servos} 
                    onExecuteFrame={executeSkillFrame}
                    connected={status.connected}
                 />
               )}
            </div>
          </div>
        </div>

        <CommandBar 
          onSend={writeSerial}
          connected={status.connected}
        />
      </div>
    </div>
  );
};

export default App;
