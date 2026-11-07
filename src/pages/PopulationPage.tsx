import React from 'react';
import CitizenIntelligenceDashboard from '../components/dashboard/CitizenIntelligenceDashboard';

/**
 * GENESIS — Population & Citizen Social Intelligence Viewport
 * Presents the comprehensive, deterministic Citizen Simulation Dashboard.
 */
export default function PopulationPage() {
  return (
    <div className="p-4 lg:p-6 flex justify-center items-start min-h-full">
      <CitizenIntelligenceDashboard />
    </div>
  );
}
