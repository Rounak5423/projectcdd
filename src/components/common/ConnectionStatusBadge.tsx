import React from 'react';
import { useCivoraWsStatus, civoraEventClient } from '../../services/realtime/CivoraEventClient';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatusBadge: React.FC<{ className?: string; worldId?: string }> = ({
  className = '',
  worldId = 'aurora-prime',
}) => {
  const status = useCivoraWsStatus();

  const handleReconnect = () => {
    if (status !== 'connected' && status !== 'connecting') {
      civoraEventClient.connect(worldId);
    }
  };

  return (
    <button
      onClick={handleReconnect}
      title={`WebSocket Status: ${status}. Click to force reconnect.`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors ${
        status === 'connected'
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
          : status === 'connecting'
          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
          : 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        {status === 'connecting' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            status === 'connected'
              ? 'bg-emerald-500'
              : status === 'connecting'
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        ></span>
      </span>

      {status === 'connected' && <Wifi className="w-3 h-3 text-emerald-400" />}
      {status === 'connecting' && <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />}
      {status !== 'connected' && status !== 'connecting' && <WifiOff className="w-3 h-3 text-rose-400" />}

      <span className="uppercase tracking-wider">
        {status === 'connected' ? 'LIVE WS' : status === 'connecting' ? 'SYNCING...' : 'OFFLINE'}
      </span>
    </button>
  );
};
