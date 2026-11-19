import React from 'react';
import CausalInsightsPage from '../features/causal/CausalInsightsPage';

export interface CausalInsightsPageProps {
  onClose?: () => void;
  onNavigate?: (page: string) => void;
}

export default function UnifiedCausalInsightsPage(props: CausalInsightsPageProps) {
  return <CausalInsightsPage {...props} />;
}
