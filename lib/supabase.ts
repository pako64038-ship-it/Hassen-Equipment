import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabaseConfig';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const SITE_URL = 'https://pako64038-ship-it.github.io/Hassen-Equipment';

export const PROJECT_TYPES = [
  { id: 'fastfood', fr: 'Fast Food', ar: 'فاست فود', em: '🍔' },
  { id: 'pizzeria', fr: 'Pizzeria', ar: 'بيتزيريا', em: '🍕' },
  { id: 'cafeteria', fr: 'Cafétéria', ar: 'كافيتيريا', em: '☕' },
  { id: 'creperie', fr: 'Crêperie', ar: 'كريبري', em: '🥞' },
  { id: 'patisserie', fr: 'Pâtisserie', ar: 'حلويات', em: '🍰' },
  { id: 'restaurant', fr: 'Restaurant', ar: 'مطعم', em: '🍽️' },
];

export const ORDER_STATUS: Record<string, string> = {
  new: 'جديد',
  contacted: 'تكلّمنا معاه',
  confirmed: 'مأكّد',
  delivered: 'تسلّم',
  cancelled: 'ملغي',
};

export const fmt = (n: number | null | undefined) =>
  n == null || isNaN(Number(n)) ? 'حسب الطلب' : Math.round(Number(n)).toLocaleString('en-US') + ' DA';

export type Settings = {
  store_name: string; tagline: string; hero_title: string; hero_text: string;
  phone: string; whatsapp: string; email: string; address: string;
  facebook: string; instagram: string; logo_url: string; accent: string;
};
export type Category = { id: string; slug: string | null; name_ar: string; name_fr: string; project_types: string[]; sort: number; active: boolean };
export type Model = {
  id: string; product_id: string; name: string; price: number | null; old_price: number | null; stock: number | null;
  width_m: number; depth_m: number; height_m: number; on_counter: boolean; images: string[]; sort: number; active: boolean;
};
export type Product = {
  id: string; category_id: string | null; name: string; description: string; project_types: string[];
  featured: boolean; active: boolean; sort: number; product_models: Model[];
};
export type PackItem = { pack_id: string; model_id: string; qty: number };
export type Pack = {
  id: string; slug: string | null; name: string; description: string; price: number; project_types: string[];
  images: string[]; featured: boolean; active: boolean; sort: number; pack_items: PackItem[];
};

export const DEFAULT_SETTINGS: Settings = {
  store_name: 'Hassen Equipment', tagline: 'معدات المطاعم والسناك · Équipement CHR',
  hero_title: 'جهّز المشروع تاعك من عندنا',
  hero_text: 'معدات Fast Food، Pizzeria، Cafétéria، Pâtisserie وRestaurant. صمّم المحل تاعك بالـ3D واطلب Devis.',
  phone: '0556 55 45 48', whatsapp: '213556554548', email: '', address: '', facebook: '', instagram: '', logo_url: '', accent: '#EE8A2E',
};

export async function loadSettings(): Promise<Settings> {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data || {}) };
}

export async function loadCatalog(staff = false) {
  const [c, p, k] = await Promise.all([
    supabase.from('categories').select('*').order('sort'),
    supabase.from('products').select('*, product_models(*)').order('sort'),
    supabase.from('packs').select('*, pack_items(*)').order('sort'),
  ]);
  const err = c.error || p.error || k.error;
  const products = ((p.data || []) as Product[]).map((x) => ({
    ...x,
    product_models: (x.product_models || []).filter((m) => staff || m.active).sort((a, b) => a.sort - b.sort),
  }));
  return {
    error: err ? err.message : null,
    categories: (c.data || []) as Category[],
    products: staff ? products : products.filter((x) => x.product_models.length),
    packs: (k.data || []) as Pack[],
  };
}

/** Resize a picked photo and upload it to the public media bucket. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await new Promise<Blob>((ok, ko) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext('2d')!;
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? ok(b) : ko(new Error('image'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => ko(new Error('image'));
    img.src = URL.createObjectURL(file);
  });
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}
