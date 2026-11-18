'use client';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, type Settings } from '@/lib/supabase';

let cache: Settings | null = null;

export function useSettings() {
  const [s, setS] = useState<Settings>(cache || DEFAULT_SETTINGS);
  useEffect(() => {
    if (cache) return;
    loadSettings().then((v) => { cache = v; setS(v); }).catch(() => {});
  }, []);
  return s;
}
export function resetSettingsCache() { cache = null; }
