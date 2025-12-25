
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
    <div className="bg-white border-t border-gray-100 p-4 shrink-0">
      <form onSubmit={handleSend} className="max-w-5xl mx-auto flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-gray-400 font-mono text-sm">TX&gt;</span>
          </div>
          <input 
            type="text"
            placeholder={connected ? "Enter manual command..." : "Connect to serial port to send commands"}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            disabled={!connected}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-12 pr-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-300"
          />
        </div>
        <button 
          type="submit"
          disabled={!connected || !cmd.trim()}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            connected && cmd.trim()
            ? 'bg-gray-900 text-white hover:bg-black active:scale-95'
            : 'bg-gray-100 text-gray-400'
          }`}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default CommandBar;
