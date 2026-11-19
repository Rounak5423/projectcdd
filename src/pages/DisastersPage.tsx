import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import DisasterManagementDashboard from '../components/dashboard/DisasterManagementDashboard';

interface DisastersPageProps {
  onClose?: () => void;
}

export default function DisastersPage({ onClose }: DisastersPageProps) {
  return (
    <div className="relative w-full h-full flex flex-col bg-[#0F1410] text-[#EAE3D2] overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-[#243324] flex items-center justify-between shrink-0 bg-[#141B15]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#2A1D1C] border border-[#3D2524] text-[#C87569]">
            <ShieldAlert size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold font-cinzel tracking-wider text-[#EAE3D2] flex items-center gap-2">
              CIVIL DEFENSE & EMERGENCY MANAGEMENT
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/30 text-rose-300 border border-rose-700/40">
                ACTIVE
              </span>
            </h1>
            <p className="text-xs text-[#8A9684] font-mono">
              First Responder Mobilization · Hazard Mitigation · Disaster Protocols
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18231A] border border-[#2B3F2E] hover:border-[#C87569] text-[#A5AD9D] hover:text-[#C87569] transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 overflow-y-auto">
        <DisasterManagementDashboard onClose={onClose} />
      </div>
    </div>
  );
}

