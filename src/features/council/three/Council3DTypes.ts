import { Advisor } from '../types/advisor';

export type CameraPreset = 'overview' | 'table' | 'advisor-focus' | 'throne';

export interface AdvisorSeatConfig {
  id: string;
  name: string;
  title: string;
  position: [number, number, number];
  rotation: [number, number, number];
  tableItemPosition: [number, number, number];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  hairColor: string;
  skinTone: string;
  artifactType: 'chancellor_seal' | 'treasurer_ledger' | 'scholar_scrolls' | 'architect_compass' | 'physician_vial' | 'keeper_botanical';
  cameraFocusPosition: [number, number, number];
  cameraFocusTarget: [number, number, number];
}

export interface CouncilChamber3DProps {
  advisors: Advisor[];
  selectedAdvisorId: string | null;
  onAdvisorSelect: (advisorId: string) => void;
  speakingAdvisorId?: string | null;
  className?: string;
}

export interface CameraTransitionState {
  preset: CameraPreset;
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  isTransitioning: boolean;
}

