'use client';

import { useEffect } from 'react';
import Header from './Header';
import SidePanel from './SidePanel';
import Catalog from './Catalog';
import Stage from './Stage';
import BottomBar from './BottomBar';

export default function Designer() {
  useEffect(() => {
    // Light, catalogue-style skin (same look as the store); set before the engine reads --scene.
    document.documentElement.classList.add('dz-light');
    // The 3D engine and catalogue logic run in the browser only.
    import('@/lib/engine').then((m) => m.startEngine());
    return () => document.documentElement.classList.remove('dz-light');
  }, []);

  return (
    <>
      <div className="app" dir="rtl">
        <Header />
        <SidePanel />
        <Catalog />
        <Stage />
        <BottomBar />
      </div>
      <div className="modal" id="modal" hidden>
        <div className="dialog" role="dialog" aria-modal="true" id="dialog" dir="rtl" />
      </div>
    </>
  );
}
