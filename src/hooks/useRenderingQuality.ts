import { useState, useEffect } from 'react';
import { qualityManager, QualitySettings } from '../services/rendering/qualityManager';

export function useRenderingQuality(): QualitySettings {
  const [settings, setSettings] = useState<QualitySettings>(() => qualityManager.getSettings());

  useEffect(() => {
    return qualityManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });
  }, []);

  return settings;
}
