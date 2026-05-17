/**
 * API Guide CMS — Island Living SXM
 * Fonctions de lecture (anon key) et d'écriture (service_role via API routes)
 * pour les tables guide_sections, guide_items, apartment_key_info, optional_partner_contacts
 */

import { createClient } from '@supabase/supabase-js';

// Client public (lecture)
const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// TYPES
// ============================================================

export interface GuideSection {
  id: string;
  apartment_id: string | null;
  scope: 'shared' | 'apartment_specific';
  section_key: string | null;
  section_type: string;
  title_fr: string;
  title_en: string;
  subtitle_fr: string | null;
  subtitle_en: string | null;
  intro_fr: string | null;
  intro_en: string | null;
  icon_name: string | null;
  cover_image_url: string | null;
  background_style: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  items?: GuideItem[];
}

export interface GuideItem {
  id: string;
  section_id: string;
  item_type: string;
  item_key: string | null;
  title_fr: string | null;
  title_en: string | null;
  short_label_fr: string | null;
  short_label_en: string | null;
  content_fr: string | null;
  content_en: string | null;
  badge_fr: string | null;
  badge_en: string | null;
  category_fr: string | null;
  category_en: string | null;
  image_url: string | null;
  icon_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website_url: string | null;
  map_url: string | null;
  external_url: string | null;
  cta_label_fr: string | null;
  cta_label_en: string | null;
  meta_json: Record<string, unknown>;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApartmentKeyInfo {
  apartment_id: string;
  wifi_name: string | null;
  wifi_password: string | null;
  gate_code: string | null;
  alarm_code: string | null;
  parking_info_fr: string | null;
  parking_info_en: string | null;
  address_text_fr: string | null;
  address_text_en: string | null;
  map_link: string | null;
  host_phone: string | null;
  emergency_phone: string | null;
  whatsapp: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
  checkin_note_fr: string | null;
  checkin_note_en: string | null;
  checkout_note_fr: string | null;
  checkout_note_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerContact {
  id: string;
  apartment_id: string | null;
  guide_item_id: string | null;
  name: string;
  category: string | null;
  whatsapp: string | null;
  email: string | null;
  website_url: string | null;
  map_url: string | null;
  note_fr: string | null;
  note_en: string | null;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// LECTURE PUBLIQUE — Guide sections + items
// ============================================================

/**
 * Récupère toutes les sections publiées pour un appartement donné.
 * Inclut les sections partagées (scope='shared') ET les sections spécifiques à la villa.
 */
export async function getGuideSections(apartmentId: string): Promise<GuideSection[]> {
  const { data, error } = await supabasePublic
    .from('guide_sections')
    .select('*')
    .eq('is_published', true)
    .or(`scope.eq.shared,apartment_id.eq.${apartmentId}`)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[api-guide] getGuideSections error:', error.message);
    return [];
  }
  return (data ?? []) as GuideSection[];
}

/**
 * Récupère les items visibles d'une section.
 */
export async function getGuideItems(sectionId: string): Promise<GuideItem[]> {
  const { data, error } = await supabasePublic
    .from('guide_items')
    .select('*')
    .eq('section_id', sectionId)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[api-guide] getGuideItems error:', error.message);
    return [];
  }
  return (data ?? []) as GuideItem[];
}

/**
 * Récupère toutes les sections avec leurs items pour un appartement.
 * Utilisé par la page guide front.
 */
export async function getFullGuide(apartmentId: string): Promise<GuideSection[]> {
  const sections = await getGuideSections(apartmentId);
  const sectionsWithItems = await Promise.all(
    sections.map(async (section) => {
      const items = await getGuideItems(section.id);
      return { ...section, items };
    })
  );
  return sectionsWithItems;
}

/**
 * Récupère les infos clés d'un appartement.
 */
export async function getApartmentKeyInfo(apartmentId: string): Promise<ApartmentKeyInfo | null> {
  const { data, error } = await supabasePublic
    .from('apartment_key_info')
    .select('*')
    .eq('apartment_id', apartmentId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[api-guide] getApartmentKeyInfo error:', error.message);
    }
    return null;
  }
  return data as ApartmentKeyInfo;
}

// ============================================================
// LECTURE ADMIN — Toutes les sections (publiées ou non)
// ============================================================

export async function getAllGuideSections(): Promise<GuideSection[]> {
  const { data, error } = await supabasePublic
    .from('guide_sections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[api-guide] getAllGuideSections error:', error.message);
    return [];
  }
  return (data ?? []) as GuideSection[];
}

export async function getAllGuideItems(sectionId: string): Promise<GuideItem[]> {
  const { data, error } = await supabasePublic
    .from('guide_items')
    .select('*')
    .eq('section_id', sectionId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[api-guide] getAllGuideItems error:', error.message);
    return [];
  }
  return (data ?? []) as GuideItem[];
}

// ============================================================
// ITEM TYPES — Catalogue des types d'items disponibles
// ============================================================

export const ITEM_TYPES = [
  { value: 'info_card',      label_fr: 'Carte info',         label_en: 'Info card' },
  { value: 'key_info',       label_fr: 'Info clé',           label_en: 'Key info' },
  { value: 'contact',        label_fr: 'Contact',            label_en: 'Contact' },
  { value: 'partner',        label_fr: 'Partenaire',         label_en: 'Partner' },
  { value: 'recommendation', label_fr: 'Recommandation',     label_en: 'Recommendation' },
  { value: 'activity_card',  label_fr: 'Activité',           label_en: 'Activity' },
  { value: 'itinerary_day',  label_fr: 'Jour itinéraire',    label_en: 'Itinerary day' },
  { value: 'house_rule',     label_fr: 'Règle de la maison', label_en: 'House rule' },
  { value: 'button_link',    label_fr: 'Bouton / Lien',      label_en: 'Button / Link' },
] as const;

export type ItemType = typeof ITEM_TYPES[number]['value'];

// ============================================================
// SECTION TYPES — Structure fixe recommandée
// ============================================================

export const FIXED_SECTION_ORDER = [
  { key: 'essential_info',     order: 10 },
  { key: 'during_stay',        order: 20 },
  { key: 'explore_saint_martin', order: 30 },
  { key: 'useful_contacts',    order: 40 },
] as const;
