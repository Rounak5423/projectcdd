import React from 'react';
import { Advisor } from '../types/advisor';
import { COUNCIL_SEATS } from './CouncilSeats';
import { AdvisorCharacter } from './AdvisorCharacter';

interface AdvisorGroupProps {
  advisors: Advisor[];
  selectedAdvisorId: string | null;
  speakingAdvisorId?: string | null;
  modelMapping?: Record<string, string>;
  onAdvisorSelect: (advisorId: string) => void;
}

export const AdvisorGroup: React.FC<AdvisorGroupProps> = ({
  advisors,
  selectedAdvisorId,
  speakingAdvisorId,
  modelMapping,
  onAdvisorSelect,
}) => {
  return (
    <group name="AdvisorCharacters">
      {COUNCIL_SEATS.map((seat) => {
        const advisor = advisors.find((a) => a.id === seat.id);
        const isSelected = selectedAdvisorId === seat.id;
        const isSpeaking = speakingAdvisorId === seat.id;
        const modelKey = modelMapping?.[seat.id];

        return (
          <AdvisorCharacter
            key={seat.id}
            seat={seat}
            advisor={advisor}
            isSelected={isSelected}
            isSpeaking={isSpeaking}
            modelKey={modelKey}
            onClick={() => onAdvisorSelect(seat.id)}
          />
        );
      })}
    </group>
  );
};
