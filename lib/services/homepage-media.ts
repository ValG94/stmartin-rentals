// ============================================================
// Service : médias du slider "Destination" de la homepage
// ============================================================

import { supabaseAdmin } from '@/lib/supabase';
import type { DestinationMedia } from '@/types';

/**
 * Liste des slides publiés ordonnés pour le rendu front.
 * Appelé depuis le Server Component de la homepage.
 */
export async function getPublishedDestinationMedia(): Promise<DestinationMedia[]> {
  const { data, error } = await supabaseAdmin
    .from('homepage_destination_media')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[homepage-media] fetch error:', error);
    return [];
  }
  return (data ?? []) as DestinationMedia[];
}

/**
 * Liste complète (publiés + masqués) pour l'admin.
 */
export async function getAllDestinationMedia(): Promise<DestinationMedia[]> {
  const { data, error } = await supabaseAdmin
    .from('homepage_destination_media')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[homepage-media] admin fetch error:', error);
    return [];
  }
  return (data ?? []) as DestinationMedia[];
}

/**
 * Détecte si une URL pointe vers une vidéo hébergée par nous (mp4/webm/mov)
 * ou un service externe YouTube/Vimeo. Utilisé côté front pour choisir entre
 * <video> natif et <iframe>.
 */
export function isHostedVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/apartment-videos/');
}
