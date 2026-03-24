#!/usr/bin/env python3
"""
Script de setup de la base de données Supabase pour StMartin Rentals.
Exécute le schéma SQL via l'API Management de Supabase.
"""

import requests
import json
import sys

SUPABASE_URL = "https://gneqqndqydrpntehhsvo.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZXFxbmRxeWRycG50ZWhoc3ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM5MzM2NSwiZXhwIjoyMDg5OTY5MzY1fQ.QTuO7Hpja2T3MIvkHWpA0vOBSevS0AjVIAQiWXtJbtY"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def run_sql(sql: str, description: str = "") -> dict:
    """Exécute une requête SQL via l'API Supabase."""
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=headers,
        json={"sql": sql},
        timeout=30
    )
    if resp.status_code not in (200, 201, 204):
        # Essayer via l'endpoint direct
        return {"error": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    return {"success": True}

def insert_data(table: str, data: dict) -> dict:
    """Insère des données dans une table Supabase."""
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={**headers, "Prefer": "return=representation,resolution=ignore-duplicates"},
        json=data,
        timeout=30
    )
    if resp.status_code in (200, 201):
        return {"success": True, "data": resp.json()}
    else:
        return {"error": f"HTTP {resp.status_code}: {resp.text[:300]}"}

def check_table_exists(table: str) -> bool:
    """Vérifie si une table existe."""
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1",
        headers=headers,
        timeout=10
    )
    return resp.status_code == 200

# ============================================================
# VÉRIFICATION DES TABLES
# ============================================================
print("=== Vérification des tables existantes ===")
tables = ["apartments", "apartment_images", "apartment_sections", "bookings", "availability_blocks", "site_settings"]
existing = []
missing = []
for t in tables:
    if check_table_exists(t):
        existing.append(t)
        print(f"  ✓ {t} existe")
    else:
        missing.append(t)
        print(f"  ✗ {t} manquante")

if missing:
    print(f"\n⚠️  Tables manquantes: {missing}")
    print("Veuillez exécuter le fichier supabase/schema.sql dans l'éditeur SQL de Supabase.")
    print(f"URL: https://supabase.com/dashboard/project/gneqqndqydrpntehhsvo/sql/new")
    sys.exit(1)

# ============================================================
# INSERTION DES DONNÉES INITIALES
# ============================================================
print("\n=== Insertion des données initiales ===")

# Site settings
result = insert_data("site_settings", {
    "contact_email": "contact@stmartin-rentals.com",
    "contact_phone": "+590 690 00 00 00",
    "contact_whatsapp": "+590690000000",
    "deposit_percentage": 30,
    "site_name_fr": "StMartin Rentals",
    "site_name_en": "StMartin Rentals"
})
print(f"  site_settings: {result}")

# Villa Azur
result = insert_data("apartments", {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "slug": "villa-azur",
    "title_fr": "Villa Azur",
    "title_en": "Villa Azur",
    "short_description_fr": "Villa de luxe avec piscine à débordement et vue mer panoramique",
    "short_description_en": "Luxury villa with infinity pool and panoramic sea view",
    "description_fr": "La Villa Azur est une propriété d'exception nichée à Terres Basses, offrant une vue mer panoramique époustouflante.",
    "description_en": "Villa Azur is an exceptional property nestled in Terres Basses, offering a breathtaking panoramic sea view.",
    "location": "Terres Basses, Saint-Martin",
    "price_per_night": 650,
    "bedrooms": 4,
    "bathrooms": 4,
    "max_guests": 8,
    "amenities": ["Piscine à débordement", "Vue mer panoramique", "Cuisine équipée", "Climatisation", "Wi-Fi haut débit", "Parking privé", "Terrasse", "BBQ"],
    "is_active": True
})
print(f"  villa-azur: {result}")

# Villa Lagon
result = insert_data("apartments", {
    "id": "a1b2c3d4-0000-0000-0000-000000000002",
    "slug": "villa-lagon",
    "title_fr": "Villa Lagon",
    "title_en": "Villa Lagon",
    "short_description_fr": "Charmante villa avec piscine privée et vue sur le lagon turquoise",
    "short_description_en": "Charming villa with private pool and turquoise lagoon view",
    "description_fr": "La Villa Lagon est un havre de paix à Sandy Ground, avec une vue imprenable sur le lagon turquoise.",
    "description_en": "Villa Lagon is a haven of peace in Sandy Ground, with a stunning view of the turquoise lagoon.",
    "location": "Sandy Ground, Saint-Martin",
    "price_per_night": 320,
    "bedrooms": 2,
    "bathrooms": 2,
    "max_guests": 4,
    "amenities": ["Piscine privée", "Vue lagon", "Cuisine équipée", "Climatisation", "Wi-Fi", "Parking", "Terrasse", "Kayaks disponibles"],
    "is_active": True
})
print(f"  villa-lagon: {result}")

print("\n✅ Setup terminé !")
