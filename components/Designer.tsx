'use client';

import { useEffect } from 'react';
import Header from './Header';
import SidePanel from './SidePanel';
import Catalog from './Catalog';
import Stage from './Stage';
import BottomBar from './BottomBar';

export default function Designer() {
  useEffect(() => {
    // The 3D engine and catalogue logic run in the browser only.
    import('@/lib/engine').then((m) => m.startEngine());
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
