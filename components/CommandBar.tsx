import React, { useState } from 'react';

interface CommandBarProps {
  onSend: (cmd: string) => void;
  connected: boolean;
}

const CommandBar: React.FC<CommandBarProps> = ({ onSend, connected }) => {
  const [cmd, setCmd] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cmd.trim() && connected) {
      onSend(cmd.trim());
      setCmd('');
    }
  };

  return (
    <div className="bg-[#f0f0f0] border-t border-[#d1d1d1] p-3 shrink-0">
      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text"
          placeholder={connected ? "Enter command..." : "Waiting for connection..."}
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          disabled={!connected}
          className="flex-1 bg-white te-border rounded-sm py-2 px-3 text-[11px] mono text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#ff4d00] disabled:bg-[#e8e8e8]"
        />
        <button 
          type="submit"
          disabled={!connected || !cmd.trim()}
          className="px-6 py-2 te-key text-[10px] font-black uppercase tracking-widest"
        >
          Execute
        </button>
      </form>
    </div>
  );
};

export default CommandBar;