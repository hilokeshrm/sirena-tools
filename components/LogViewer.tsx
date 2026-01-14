import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

// Maximum number of logs to display at once for performance
const MAX_DISPLAYED_LOGS = 500;
const LOG_BATCH_SIZE = 100;

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayedCount, setDisplayedCount] = useState(MAX_DISPLAYED_LOGS);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const wasAtBottomRef = useRef(true);

  // Limit displayed logs to improve performance
  const displayedLogs = useMemo(() => {
    // Always show the most recent logs
    const startIndex = Math.max(0, logs.length - displayedCount);
    return logs.slice(startIndex);
  }, [logs, displayedCount]);

  // Check if user is at bottom of scroll
  const checkScrollPosition = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
    wasAtBottomRef.current = isAtBottom;
    setIsAutoScroll(isAtBottom);
  }, []);

  // Auto-scroll to bottom only if user was already at bottom
  useEffect(() => {
    if (scrollRef.current && isAutoScroll && wasAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLogs, isAutoScroll]);

  // Show more logs when user scrolls to top
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    checkScrollPosition();
    
    // If scrolled to top and there are more logs, load more
    if (scrollRef.current.scrollTop < 100 && displayedCount < logs.length) {
      setDisplayedCount(prev => Math.min(prev + LOG_BATCH_SIZE, logs.length));
    }
  }, [logs.length, displayedCount, checkScrollPosition]);

  // Reset displayed count when logs are cleared
  useEffect(() => {
    if (logs.length === 0) {
      setDisplayedCount(MAX_DISPLAYED_LOGS);
    } else if (logs.length < displayedCount) {
      setDisplayedCount(Math.min(MAX_DISPLAYED_LOGS, logs.length));
    }
  }, [logs.length]);

  // Memoize log items to prevent unnecessary re-renders
  const LogItem = React.memo(({ log }: { log: LogEntry }) => (
    <div className="flex gap-4 border-b border-[#f5f5f5] pb-0.5">
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
  ));

  LogItem.displayName = 'LogItem';

  const hiddenLogsCount = logs.length - displayedLogs.length;

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 mono text-[10px] leading-relaxed relative bg-white"
    >
      {logs.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-[#ccc]">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Standby</p>
        </div>
      )}
      
      {hiddenLogsCount > 0 && (
        <div className="sticky top-0 bg-white border-b border-[#e0e0e0] py-2 mb-2 z-10">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-[#888] uppercase">
              {hiddenLogsCount} older logs hidden (scroll up to load more)
            </span>
            <button
              onClick={() => setDisplayedCount(logs.length)}
              className="text-[8px] font-bold uppercase text-[#ff4d00] hover:underline px-2"
            >
              Show All ({logs.length})
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-0.5">
        {displayedLogs.map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </div>
      
      <div className="h-8" />
    </div>
  );
};

export default React.memo(LogViewer);