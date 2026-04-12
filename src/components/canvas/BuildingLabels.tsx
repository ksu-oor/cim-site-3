'use client';

import { Html } from '@react-three/drei';
import { CIM_BUILDINGS } from '@/lib/voxel/cim-structures';
import { useMemo } from 'react';

const LABEL_HEIGHT = 40;

const BUILDING_TAGLINES: Record<string, string> = {
  'Game Studio': 'Where play becomes profession',
  'Digital Twin': 'Modeling the Peach State, digitally',
  'XR Healthcare': 'Healing through immersion',
  'Digital Humanities': 'Technology meets culture',
};

export function BuildingLabels() {
  const labels = useMemo(
    () =>
      CIM_BUILDINGS.map((b) => ({
        name: b.name,
        tagline: BUILDING_TAGLINES[b.name] ?? '',
        position: [b.origin[0] + 5, LABEL_HEIGHT, b.origin[1] + 4] as [number, number, number],
      })),
    [],
  );

  return (
    <>
      {labels.map((label) => (
        <Html
          key={label.name}
          position={label.position}
          center
          distanceFactor={30}
          occlude={false}
          style={{ pointerEvents: 'none' }}
        >
          <div className="select-none" style={{ pointerEvents: 'none', width: '160px', textAlign: 'center' }}>
            <div
              className="px-3 py-1.5 rounded-lg text-white font-medium text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              <div>{label.name}</div>
              {label.tagline && (
                <div className="text-[10px] text-white/50 font-normal italic mt-0.5">
                  {label.tagline}
                </div>
              )}
            </div>
          </div>
        </Html>
      ))}
    </>
  );
}
