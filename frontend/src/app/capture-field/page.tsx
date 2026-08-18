'use client';

import dynamic from 'next/dynamic';

const MapBoundaryTool = dynamic(
  () => import('../../components/MapBoundaryTool'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
        Loading GIS Map Module...
      </div>
    ),
  }
);

export default function CaptureFieldPage() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <MapBoundaryTool />
    </main>
  );
}