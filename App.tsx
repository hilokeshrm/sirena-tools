
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogEntry, ServoConfig, SerialStatus } from './types';
import LogViewer from './components/LogViewer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import CommandBar from './components/CommandBar';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  // Serial State
  const [port, setPort] = useState<any>(null);
  const [status, setStatus] = useState<SerialStatus>({ connected: false });
  const [baudRate, setBaudRate] = useState<number>(57600);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Servo State
  const [servoConfig, setServoConfig] = useState<ServoConfig>({
    numServos: 1,
    servoIds: [0],
    baudRate: 230400,
  });
  const [angle, setAngle] = useState<number>(180);
  const [velocity, setVelocity] = useState<number>(256);

  // Refs for persistent storage and preventing stale closures
  const readerRef = useRef<any>(null);
  const logsRef = useRef<LogEntry[]>([]);
  const isReadingRef = useRef<boolean>(false);

  // Add Log Helper
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'rx') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    logsRef.current = [...logsRef.current.slice(-1999), newLog];
    setLogs([...logsRef.current]);
  }, []);

  // Connect to Serial
  const connect = async () => {
    if (!('serial' in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use a Chromium-based browser (Chrome, Edge, Opera).");
      return;
    }

    try {
      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate });
      
      setPort(selectedPort);
      setStatus({ connected: true, portName: "Connected Device" });
      addLog(`System: Connected at ${baudRate} baud`, 'info');

      startReading(selectedPort);
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message;
      if (err.name === 'SecurityError') {
        errorMsg = "Serial access is blocked by browser security policy. Please ensure the site has permission to access serial ports.";
      }
      setStatus({ connected: false, error: errorMsg });
      addLog(`Error: ${errorMsg}`, 'error');
      alert(errorMsg);
    }
  };

  const disconnect = async () => {
    isReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {}
    }
    if (port) {
      try {
        await port.close();
      } catch (e) {}
    }
    setPort(null);
    setStatus({ connected: false });
    addLog(`System: Serial Port Disconnected`, 'info');
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
          
          lines.forEach(line => {
            if (line.trim()) addLog(line.trim(), 'rx');
          });
        }
      } catch (err) {
        if (isReadingRef.current) {
          console.error("Read Error:", err);
          addLog(`Read Error: ${err}`, 'error');
        }
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
      console.error("Write Error:", err);
      addLog(`Write Error: ${err}`, 'error');
    } finally {
      writer.releaseLock();
    }
  };

  const sendServoCommand = () => {
    const snappedAngle = Math.round(angle / 5) * 5;
    const idsStr = servoConfig.servoIds.join(',');
    const position = Math.floor((snappedAngle / 360) * 4095);
    const cmd = `LUCI_local 245 SetServoPartial:${idsStr}:${position}:${velocity}`;
    writeSerial(cmd);
  };

  const sendInterrupt = () => {
    if (!port || !port.writable) return;
    const writer = port.writable.getWriter();
    try {
      writer.write(new Uint8Array([0x03]));
      addLog(`[Ctrl+C Interrupt Sent]`, 'tx');
    } catch (err) {
      addLog(`Interrupt Error: ${err}`, 'error');
    } finally {
      writer.releaseLock();
    }
  };

  const clearLogs = () => {
    logsRef.current = [];
    setLogs([]);
  };

  return (
    <div className="flex h-screen w-screen bg-white font-sans selection:bg-red-100 selection:text-red-900">
      <Sidebar 
        status={status}
        baudRate={baudRate}
        onBaudChange={setBaudRate}
        onConnect={connect}
        onDisconnect={disconnect}
        servoConfig={servoConfig}
        onServoConfigChange={setServoConfig}
      />

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Header />
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
          <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
            <ControlPanel 
              angle={angle}
              onAngleChange={setAngle}
              velocity={velocity}
              onVelocityChange={setVelocity}
              onSend={sendServoCommand}
              connected={status.connected}
              onInterrupt={sendInterrupt}
            />
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                Device Telemetry
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Protocol</span>
                  <span className="font-mono text-gray-700">LUCI_local v1</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Target</span>
                  <span className="font-mono text-gray-700">MB 245</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent pointer-events-none" />
            <LogViewer logs={logs} />
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={clearLogs}
                className="px-4 py-1.5 bg-slate-800/80 backdrop-blur-md text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-slate-500 shadow-lg"
              >
                Clear Console
              </button>
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
