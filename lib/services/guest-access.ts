// Accès voyageur (Wi-Fi) envoyé dans le mail de confirmation. Lu avec la
// clé service : ces colonnes ne sont pas lisibles avec la clé publique.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface GuestWifi {
  name: string;
  password: string | null;
}

export async function getGuestWifi(sb: SupabaseClient, apartmentId: string | null | undefined): Promise<GuestWifi | undefined> {
  if (!apartmentId) return undefined;
  const { data } = await sb
    .from('apartment_key_info')
    .select('wifi_name, wifi_password')
    .eq('apartment_id', apartmentId)
    .maybeSingle();
  if (!data?.wifi_name) return undefined;
  return { name: data.wifi_name, password: data.wifi_password || null };
}
