'use client';
import { useEffect, useState } from 'react';

export type CartLine = { key: string; kind: 'model' | 'pack'; id: string; name: string; price: number | null; qty: number; image?: string };

const KEY = 'hassen.cart.v1';
const EVT = 'hassen-cart';

export function readCart(): CartLine[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function write(lines: CartLine[]) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  window.dispatchEvent(new Event(EVT));
}
export function addToCart(line: Omit<CartLine, 'key' | 'qty'>, qty = 1) {
  const lines = readCart(); const key = line.kind + ':' + line.id;
  const ex = lines.find((l) => l.key === key);
  if (ex) ex.qty += qty; else lines.push({ ...line, key, qty });
  write(lines);
}
export function setQty(key: string, qty: number) {
  write(readCart().map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0));
}
export function clearCart() { write([]); }

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    const up = () => setLines(readCart());
    up(); window.addEventListener(EVT, up); window.addEventListener('storage', up);
    return () => { window.removeEventListener(EVT, up); window.removeEventListener('storage', up); };
  }, []);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + (l.price || 0) * l.qty, 0);
  const unknown = lines.some((l) => l.price == null);
  return { lines, count, total, unknown };
}
