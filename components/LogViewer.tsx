
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
      className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed space-y-1 relative z-10"
    >
      {logs.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 008.384-4.51l.054.09m-4.283-9.93L12 3m0 0l-3.883 8.07M12 3v13m0-13a10.003 10.003 0 018.384 4.51L12 3z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold uppercase tracking-[0.2em] text-xs">Waiting for Signal</p>
            <p className="text-[10px] opacity-60">Establish serial link to begin data capture</p>
          </div>
        </div>
      )}
      {logs.map((log) => (
        <div key={log.id} className="flex gap-4 group hover:bg-white/5 py-0.5 px-2 rounded transition-colors">
          <span className="text-slate-600 shrink-0 select-none font-bold tabular-nums">[{log.timestamp}]</span>
          
          {log.type === 'tx' && <span className="text-blue-500 font-bold shrink-0">TX&gt;</span>}
          {log.type === 'rx' && <span className="text-emerald-500 font-bold shrink-0">RX&lt;</span>}
          
          <span className={`break-all whitespace-pre-wrap ${
            log.type === 'rx' ? 'text-slate-200' :
            log.type === 'tx' ? 'text-blue-300 font-bold' :
            log.type === 'error' ? 'text-red-400 font-bold' :
            'text-amber-400 italic'
          }`}>
            {log.message}
          </span>
        </div>
      ))}
      <div className="h-4" />
    </div>
  );
};

export default LogViewer;
