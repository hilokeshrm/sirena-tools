import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 mono text-[10px] leading-relaxed relative bg-white"
    >
      {logs.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-[#ccc]">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Standby</p>
        </div>
      )}
      <div className="space-y-0.5">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 border-b border-[#f5f5f5] pb-0.5">
            <span className="text-[#aaa] shrink-0 tabular-nums">{log.timestamp}</span>
            <span className={`shrink-0 font-bold ${
              log.type === 'tx' ? 'text-blue-500' : 
              log.type === 'rx' ? 'te-orange' : 
              log.type === 'error' ? 'text-red-500' : 'text-[#888]'
            }`}>
              {log.type.toUpperCase()}
            </span>
            <span className={`break-all whitespace-pre-wrap ${
              log.type === 'error' ? 'font-bold' : 'text-[#333]'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
      <div className="h-8" />
    </div>
  );
};

export default LogViewer;