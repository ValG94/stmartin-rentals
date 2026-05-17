'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  BookOpen, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  Save, ArrowLeft, Settings, Smartphone, X, Check, AlertCircle,
  Globe, Home, Edit3, Info,
} from 'lucide-react';
import GuideIcon from '@/components/guide/GuideIcon';
import { GUIDE_ICON_REGISTRY, GUIDE_ICON_GROUPS } from '@/lib/guide-icons';
import { ITEM_TYPES, type GuideSection, type GuideItem, type ApartmentKeyInfo } from '@/lib/api-guide';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types locaux ──────────────────────────────────────────────
interface Apartment { id: string; title_fr: string; title_en: string; slug: string; }

type AdminTab = 'sections' | 'key_info' | 'preview';

// ── Composant principal ───────────────────────────────────────
export default function AdminGuidePage() {
  const params = useParams();
  const locale = params?.locale as string ?? 'fr';
  const { isAuthenticated, isLoading } = useAdminAuth();

  const [tab, setTab] = useState<AdminTab>('sections');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [keyInfo, setKeyInfo] = useState<Partial<ApartmentKeyInfo>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sectionItems, setSectionItems] = useState<Record<string, GuideItem[]>>({});
  const [saving, setSaving] = useState(false);
  const [keyInfoLoading, setKeyInfoLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<GuideItem> | null>(null);
  const [editingItemSectionId, setEditingItemSectionId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<GuideSection> | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'section' | 'item'>('section');
  const [previewLocale, setPreviewLocale] = useState<'fr' | 'en'>('fr');
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Upload image partenaire ───────────────────────────────────
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/guide/upload-image', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) { showMsg('error', json.error ?? 'Erreur upload'); return; }
      setEditingItem(p => ({ ...p!, image_url: json.url }));
      showMsg('success', 'Image uploadée !');
    } catch {
      showMsg('error', 'Erreur réseau lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Chargement initial ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    supabase.from('apartments').select('id, title_fr, title_en, slug').order('title_fr')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setApartments(data);
          setSelectedApartmentId(data[0].id);
        }
      });
  }, [isAuthenticated]);

  const loadSections = useCallback(async () => {
    if (!selectedApartmentId) return;
    const { data } = await supabase
      .from('guide_sections')
      .select('*')
      .or(`scope.eq.shared,apartment_id.eq.${selectedApartmentId}`)
      .order('display_order', { ascending: true });
    setSections((data ?? []) as GuideSection[]);
  }, [selectedApartmentId]);

  const loadKeyInfo = useCallback(async () => {
    if (!selectedApartmentId) return;
    // Reset immédiat pour éviter d'afficher les données de la villa précédente
    setKeyInfo({});
    setKeyInfoLoading(true);
    const { data } = await supabase
      .from('apartment_key_info')
      .select('*')
      .eq('apartment_id', selectedApartmentId)
      .maybeSingle();
    setKeyInfo(data ?? {});
    setKeyInfoLoading(false);
  }, [selectedApartmentId]);

  useEffect(() => {
    loadSections();
    loadKeyInfo();
  }, [loadSections, loadKeyInfo]);

  const loadItems = useCallback(async (sectionId: string) => {
    const { data } = await supabase
      .from('guide_items')
      .select('*')
      .eq('section_id', sectionId)
      .order('display_order', { ascending: true });
    setSectionItems(prev => ({ ...prev, [sectionId]: (data ?? []) as GuideItem[] }));
  }, []);

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      if (!sectionItems[sectionId]) loadItems(sectionId);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Sauvegarde infos clés ─────────────────────────────────────
  const saveKeyInfo = async () => {
    if (!selectedApartmentId) return;
    setSaving(true);
    const { error } = await supabase
      .from('apartment_key_info')
      .upsert({ ...keyInfo, apartment_id: selectedApartmentId }, { onConflict: 'apartment_id' });
    setSaving(false);
    if (error) showMsg('error', error.message);
    else showMsg('success', 'Infos clés sauvegardées !');
  };

  // ── Toggle publication section ────────────────────────────────
  const togglePublish = async (section: GuideSection) => {
    await supabase.from('guide_sections')
      .update({ is_published: !section.is_published })
      .eq('id', section.id);
    loadSections();
  };

  // ── Toggle visibilité item ────────────────────────────────────
  const toggleItemVisible = async (item: GuideItem, sectionId: string) => {
    await supabase.from('guide_items')
      .update({ is_visible: !item.is_visible })
      .eq('id', item.id);
    loadItems(sectionId);
  };

  // ── Réordonner items ──────────────────────────────────────────
  const moveItem = async (item: GuideItem, sectionId: string, dir: 'up' | 'down') => {
    const items = sectionItems[sectionId] ?? [];
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const swapItem = items[swapIdx];
    await supabase.from('guide_items').update({ display_order: swapItem.display_order }).eq('id', item.id);
    await supabase.from('guide_items').update({ display_order: item.display_order }).eq('id', swapItem.id);
    loadItems(sectionId);
  };

  // ── Supprimer item ────────────────────────────────────────────
  const deleteItem = async (itemId: string, sectionId: string) => {
    if (!confirm('Supprimer cet item ?')) return;
    await supabase.from('guide_items').delete().eq('id', itemId);
    loadItems(sectionId);
  };

  // ── Sauvegarder item (création ou mise à jour) ────────────────
  const saveItem = async () => {
    if (!editingItem || !editingItemSectionId) return;
    setSaving(true);
    const items = sectionItems[editingItemSectionId] ?? [];
    const maxOrder = items.reduce((m, i) => Math.max(m, i.display_order), 0);
    const payload = {
      ...editingItem,
      section_id: editingItemSectionId,
      display_order: editingItem.display_order ?? maxOrder + 10,
      meta_json: editingItem.meta_json ?? {},
    };
    let error;
    if (editingItem.id) {
      ({ error } = await supabase.from('guide_items').update(payload).eq('id', editingItem.id));
    } else {
      ({ error } = await supabase.from('guide_items').insert(payload));
    }
    setSaving(false);
    if (error) { showMsg('error', error.message); return; }
    showMsg('success', 'Item sauvegardé !');
    setEditingItem(null);
    setEditingItemSectionId(null);
    loadItems(editingItemSectionId);
  };

  // ── Sauvegarder section ───────────────────────────────────────
  const saveSection = async () => {
    if (!editingSection) return;
    setSaving(true);
    const payload = {
      ...editingSection,
      apartment_id: editingSection.scope === 'apartment_specific' ? selectedApartmentId : null,
    };
    let error;
    if (editingSection.id) {
      ({ error } = await supabase.from('guide_sections').update(payload).eq('id', editingSection.id));
    } else {
      ({ error } = await supabase.from('guide_sections').insert(payload));
    }
    setSaving(false);
    if (error) { showMsg('error', error.message); return; }
    showMsg('success', 'Section sauvegardée !');
    setEditingSection(null);
    loadSections();
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Supprimer cette section et tous ses items ?')) return;
    await supabase.from('guide_sections').delete().eq('id', sectionId);
    loadSections();
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  const selectedApt = apartments.find(a => a.id === selectedApartmentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-[#0D1B2A] text-white px-6 py-5">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/admin/apartments`} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <BookOpen size={20} className="text-[#B08B52]" />
          <div>
            <h1 className="font-serif text-lg font-semibold">Guide digital</h1>
            <p className="text-xs text-white/40">Administration du contenu</p>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {msg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* ── Tabs + Sélecteur villa ── */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        {/* Sélecteur de villa — toujours visible */}
        <div className="flex items-center gap-3 py-3 border-b border-gray-100">
          <Home size={15} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">Villa</span>
          <select
            value={selectedApartmentId}
            onChange={e => setSelectedApartmentId(e.target.value)}
            className="flex-1 border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#B08B52] bg-white font-medium"
          >
            {apartments.map(a => (
              <option key={a.id} value={a.id}>{a.title_fr}</option>
            ))}
          </select>
        </div>
        {/* Onglets */}
        <div className="flex gap-1">
          {([
            { id: 'sections', label: 'Sections & Contenus', icon: BookOpen },
            { id: 'key_info', label: 'Infos clés', icon: Settings },
            { id: 'preview', label: 'Aperçu mobile', icon: Smartphone },
          ] as { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${tab === t.id ? 'border-[#B08B52] text-[#B08B52]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ══════════════════════════════════════════════════════
            TAB : SECTIONS & CONTENUS
        ══════════════════════════════════════════════════════ */}
        {tab === 'sections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sections du guide</h2>
                <p className="text-sm text-gray-500">Les sections communes s&apos;appliquent aux 2 villas.</p>
              </div>
              <button
                onClick={() => setEditingSection({ scope: 'shared', section_type: 'generic', title_fr: '', title_en: '', display_order: 50, is_published: true })}
                className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] text-white rounded-lg text-sm font-medium hover:bg-[#1A3D5C] transition-colors"
              >
                <Plus size={15} /> Nouvelle section
              </button>
            </div>

            {sections.map(section => (
              <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button onClick={() => toggleSection(section.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <GuideIcon name={section.icon_name} size={18} className="text-[#B08B52]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{section.title_fr}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                          ${section.scope === 'shared' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {section.scope === 'shared' ? 'Commune aux villas' : 'Spécifique à la villa'}
                        </span>
                        {!section.is_published && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Non publiée</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{section.title_en}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditingSection(section)} className="p-2 text-gray-400 hover:text-[#B08B52] transition-colors" title="Modifier">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => togglePublish(section)} className="p-2 text-gray-400 hover:text-[#B08B52] transition-colors" title={section.is_published ? 'Dépublier' : 'Publier'}>
                      {section.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    {section.scope === 'apartment_specific' && (
                      <button onClick={() => deleteSection(section.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    )}
                    <button onClick={() => toggleSection(section.id)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      {expandedSection === section.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Section items */}
                {expandedSection === section.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-2">
                    {(sectionItems[section.id] ?? []).map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                        <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <GuideIcon name={item.icon_name} size={14} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.title_fr || item.short_label_fr || '—'}</p>
                          <p className="text-xs text-gray-400 truncate">{item.item_type} · {item.title_en || item.short_label_en || '—'}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => moveItem(item, section.id, 'up')} disabled={idx === 0} className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveItem(item, section.id, 'down')} disabled={idx === (sectionItems[section.id]?.length ?? 0) - 1} className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                            <ChevronDown size={14} />
                          </button>
                          <button onClick={() => { setEditingItem(item); setEditingItemSectionId(section.id); }} className="p-1.5 text-gray-400 hover:text-[#B08B52] transition-colors">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => toggleItemVisible(item, section.id)} className="p-1.5 text-gray-400 hover:text-[#B08B52] transition-colors">
                            {item.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button onClick={() => deleteItem(item.id, section.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => { setEditingItem({ item_type: 'info_card', is_visible: true, meta_json: {} }); setEditingItemSectionId(section.id); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-[#B08B52] hover:text-[#B08B52] transition-colors"
                    >
                      <Plus size={15} /> Ajouter un item
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB : INFOS CLÉS
        ══════════════════════════════════════════════════════ */}
        {tab === 'key_info' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Infos clés — {selectedApt?.title_fr}</h2>
                <p className="text-sm text-gray-500">Ces informations sont propres à cette villa et n&apos;affectent pas les autres.</p>
              </div>
              <button onClick={saveKeyInfo} disabled={saving || keyInfoLoading} className="flex items-center gap-2 px-5 py-2.5 bg-[#B08B52] text-white rounded-lg text-sm font-medium hover:bg-[#8C6A38] transition-colors disabled:opacity-50">
                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>

            {/* Indicateur de chargement */}
            {keyInfoLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-7 h-7 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Formulaire masqué pendant le chargement */}
            {!keyInfoLoading && (<>

            {/* Accès */}
            <KeyInfoBlock title="Accès & Codes" icon="key">
              <KeyInfoField label="Nom Wi-Fi" value={keyInfo.wifi_name ?? ''} onChange={v => setKeyInfo(p => ({ ...p, wifi_name: v }))} />
              <KeyInfoField label="Mot de passe Wi-Fi" value={keyInfo.wifi_password ?? ''} onChange={v => setKeyInfo(p => ({ ...p, wifi_password: v }))} sensitive />
              <KeyInfoField label="Code portail / gate" value={keyInfo.gate_code ?? ''} onChange={v => setKeyInfo(p => ({ ...p, gate_code: v }))} sensitive />
              <KeyInfoField label="Code alarme" value={keyInfo.alarm_code ?? ''} onChange={v => setKeyInfo(p => ({ ...p, alarm_code: v }))} sensitive />
            </KeyInfoBlock>

            {/* Check-in / Check-out */}
            <KeyInfoBlock title="Arrivée & Départ" icon="clock">
              <KeyInfoField label="Heure d'arrivée" value={keyInfo.checkin_time ?? ''} onChange={v => setKeyInfo(p => ({ ...p, checkin_time: v }))} placeholder="ex: 15:00" />
              <KeyInfoField label="Heure de départ" value={keyInfo.checkout_time ?? ''} onChange={v => setKeyInfo(p => ({ ...p, checkout_time: v }))} placeholder="ex: 11:00" />
              <KeyInfoField label="Note arrivée (FR)" value={keyInfo.checkin_note_fr ?? ''} onChange={v => setKeyInfo(p => ({ ...p, checkin_note_fr: v }))} multiline />
              <KeyInfoField label="Note arrivée (EN)" value={keyInfo.checkin_note_en ?? ''} onChange={v => setKeyInfo(p => ({ ...p, checkin_note_en: v }))} multiline />
              <KeyInfoField label="Note départ (FR)" value={keyInfo.checkout_note_fr ?? ''} onChange={v => setKeyInfo(p => ({ ...p, checkout_note_fr: v }))} multiline />
              <KeyInfoField label="Note départ (EN)" value={keyInfo.checkout_note_en ?? ''} onChange={v => setKeyInfo(p => ({ ...p, checkout_note_en: v }))} multiline />
            </KeyInfoBlock>

            {/* Contact */}
            <KeyInfoBlock title="Contact & Urgences" icon="phone">
              <KeyInfoField label="Téléphone hôte" value={keyInfo.host_phone ?? ''} onChange={v => setKeyInfo(p => ({ ...p, host_phone: v }))} placeholder="+1 514 947-6100" />
              <KeyInfoField label="WhatsApp" value={keyInfo.whatsapp ?? ''} onChange={v => setKeyInfo(p => ({ ...p, whatsapp: v }))} placeholder="+15149476100" />
              <KeyInfoField label="SAMU / Ambulance" value={keyInfo.emergency_phone ?? ''} onChange={v => setKeyInfo(p => ({ ...p, emergency_phone: v }))} placeholder="ex: 15 ou 912" />
              <KeyInfoField label="Pompiers" value={keyInfo.fire_phone ?? ''} onChange={v => setKeyInfo(p => ({ ...p, fire_phone: v }))} placeholder="ex: 18 ou 912" />
            </KeyInfoBlock>

            {/* Adresse */}
            <KeyInfoBlock title="Adresse & Parking" icon="map-pin">
              <KeyInfoField label="Adresse (FR)" value={keyInfo.address_text_fr ?? ''} onChange={v => setKeyInfo(p => ({ ...p, address_text_fr: v }))} multiline />
              <KeyInfoField label="Adresse (EN)" value={keyInfo.address_text_en ?? ''} onChange={v => setKeyInfo(p => ({ ...p, address_text_en: v }))} multiline />
              <KeyInfoField label="Lien Google Maps" value={keyInfo.map_link ?? ''} onChange={v => setKeyInfo(p => ({ ...p, map_link: v }))} placeholder="https://maps.google.com/..." />
              <KeyInfoField label="Parking (FR)" value={keyInfo.parking_info_fr ?? ''} onChange={v => setKeyInfo(p => ({ ...p, parking_info_fr: v }))} multiline />
              <KeyInfoField label="Parking (EN)" value={keyInfo.parking_info_en ?? ''} onChange={v => setKeyInfo(p => ({ ...p, parking_info_en: v }))} multiline />
            </KeyInfoBlock>

            </>)}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB : APERÇU MOBILE
        ══════════════════════════════════════════════════════ */}
        {tab === 'preview' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewLocale('fr')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${previewLocale === 'fr' ? 'bg-[#0D1B2A] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>FR</button>
              <button onClick={() => setPreviewLocale('en')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${previewLocale === 'en' ? 'bg-[#0D1B2A] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>EN</button>
              <Link
                href={`/${previewLocale}/apartments/${selectedApt?.slug ?? ''}/guide`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-[#B08B52] text-white hover:bg-[#8C6A38] transition-colors"
              >
                <Globe size={14} /> Voir en ligne
              </Link>
            </div>

            {/* Phone frame */}
            <div className="relative w-[375px] h-[720px] bg-white rounded-[40px] border-4 border-gray-800 shadow-2xl overflow-hidden flex flex-col">
              {/* Status bar */}
              <div className="bg-gray-50 flex items-center justify-between px-6 py-2 text-[10px] text-gray-500 border-b border-gray-100 flex-shrink-0">
                <span>9:41</span>
                <span className="font-medium">Island Living SXM</span>
                <span>●●●</span>
              </div>
              {/* Guide preview */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {/* Header */}
                <div className="bg-[#0D1B2A] px-5 py-5">
                  <p className="text-[#B08B52] text-[9px] font-medium tracking-widest uppercase mb-1">
                    {previewLocale === 'fr' ? 'Guide de la villa' : 'Villa Guide'}
                  </p>
                  <p className="text-white font-serif text-base font-semibold">
                    {previewLocale === 'fr' ? selectedApt?.title_fr : selectedApt?.title_en}
                  </p>
                </div>
                {/* Key info quick cards */}
                {(keyInfo.wifi_name || keyInfo.checkin_time || keyInfo.host_phone) && (
                  <div className="px-4 py-4 space-y-2">
                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                      {previewLocale === 'fr' ? 'Accès rapide' : 'Quick access'}
                    </p>
                    {keyInfo.wifi_name && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <GuideIcon name="wifi" size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400">Wi-Fi</p>
                          <p className="text-xs font-semibold text-gray-800">{keyInfo.wifi_name}</p>
                        </div>
                      </div>
                    )}
                    {keyInfo.checkin_time && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <GuideIcon name="clock" size={14} className="text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400">{previewLocale === 'fr' ? 'Arrivée' : 'Check-in'}</p>
                          <p className="text-xs font-semibold text-gray-800">{keyInfo.checkin_time}</p>
                        </div>
                      </div>
                    )}
                    {keyInfo.host_phone && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <GuideIcon name="phone" size={14} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400">{previewLocale === 'fr' ? 'Contact hôte' : 'Host contact'}</p>
                          <p className="text-xs font-semibold text-gray-800">{keyInfo.host_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Sections preview */}
                <div className="px-4 pb-6 space-y-2">
                  {sections.filter(s => s.is_published).map(section => (
                    <div key={section.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <GuideIcon name={section.icon_name} size={14} className="text-[#B08B52]" />
                        <p className="text-xs font-semibold text-gray-800">
                          {previewLocale === 'fr' ? section.title_fr : section.title_en}
                        </p>
                      </div>
                      {section.intro_fr && (
                        <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2">
                          {previewLocale === 'fr' ? section.intro_fr : section.intro_en}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Aperçu simplifié — voir le site pour le rendu complet</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL : Édition item
      ══════════════════════════════════════════════════════ */}
      {editingItem !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-gray-900">{editingItem.id ? 'Modifier l\'item' : 'Nouvel item'}</h3>
              <button onClick={() => { setEditingItem(null); setEditingItemSectionId(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Type d&apos;item</label>
                <select
                  value={editingItem.item_type ?? 'info_card'}
                  onChange={e => setEditingItem(p => ({ ...p!, item_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]"
                >
                  {ITEM_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label_fr}</option>
                  ))}
                </select>
              </div>
              {/* Icône */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Icône</label>
                <button
                  type="button"
                  onClick={() => { setIconPickerTarget('item'); setShowIconPicker(true); }}
                  className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 text-sm hover:border-[#B08B52] transition-colors w-full"
                >
                  <GuideIcon name={editingItem.icon_name} size={18} className="text-[#B08B52]" />
                  <span className="text-gray-600">{editingItem.icon_name ?? 'Choisir une icône'}</span>
                </button>
              </div>
              {/* Titre FR/EN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Titre FR</label>
                  <input value={editingItem.title_fr ?? ''} onChange={e => setEditingItem(p => ({ ...p!, title_fr: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="Titre en français" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Titre EN</label>
                  <input value={editingItem.title_en ?? ''} onChange={e => setEditingItem(p => ({ ...p!, title_en: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="Title in English" />
                </div>
              </div>
              {/* Contenu FR/EN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Contenu FR</label>
                  <textarea value={editingItem.content_fr ?? ''} onChange={e => setEditingItem(p => ({ ...p!, content_fr: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52] resize-none" placeholder="Description en français" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Contenu EN</label>
                  <textarea value={editingItem.content_en ?? ''} onChange={e => setEditingItem(p => ({ ...p!, content_en: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52] resize-none" placeholder="Description in English" />
                </div>
              </div>
              {/* Catégorie + Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Catégorie FR</label>
                  <input value={editingItem.category_fr ?? ''} onChange={e => setEditingItem(p => ({ ...p!, category_fr: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="ex: Mer / Aventure" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Catégorie EN</label>
                  <input value={editingItem.category_en ?? ''} onChange={e => setEditingItem(p => ({ ...p!, category_en: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="ex: Sea / Adventure" />
                </div>
              </div>
              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Téléphone</label>
                  <input value={editingItem.phone ?? ''} onChange={e => setEditingItem(p => ({ ...p!, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="+1 514..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">WhatsApp</label>
                  <input value={editingItem.whatsapp ?? ''} onChange={e => setEditingItem(p => ({ ...p!, whatsapp: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="+15149476100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label>
                  <input value={editingItem.email ?? ''} onChange={e => setEditingItem(p => ({ ...p!, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="contact@..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Site web</label>
                  <input value={editingItem.website_url ?? ''} onChange={e => setEditingItem(p => ({ ...p!, website_url: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Lien Maps</label>
                <input value={editingItem.map_url ?? ''} onChange={e => setEditingItem(p => ({ ...p!, map_url: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="https://maps.google.com/..." />
              </div>
              {/* Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Photo (optionnel)</label>
                {/* Upload depuis le PC */}
                <div className="flex items-center gap-3 mb-2">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer text-sm font-medium transition-colors ${
                    uploadingImage ? 'border-gray-200 text-gray-400' : 'border-[#B08B52]/40 text-[#B08B52] hover:border-[#B08B52] hover:bg-[#B08B52]/5'
                  }`}>
                    <input type="file" accept="image/*" className="hidden"
                      disabled={uploadingImage}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
                    />
                    {uploadingImage ? (
                      <><span className="w-4 h-4 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" /> Upload en cours...</>
                    ) : (
                      <>📷 Choisir depuis le PC</>
                    )}
                  </label>
                  {editingItem.image_url && (
                    <button onClick={() => setEditingItem(p => ({ ...p!, image_url: '' }))}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Supprimer
                    </button>
                  )}
                </div>
                {/* Ou URL externe */}
                <input value={editingItem.image_url ?? ''} onChange={e => setEditingItem(p => ({ ...p!, image_url: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="Ou coller une URL https://..." />
                {/* Aperçu */}
                {editingItem.image_url && (
                  <div className="mt-2 rounded-xl overflow-hidden h-28 bg-gray-100">
                    <img src={editingItem.image_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setEditingItem(null); setEditingItemSectionId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                Annuler
              </button>
              <button onClick={saveItem} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-[#B08B52] text-white rounded-lg text-sm font-medium hover:bg-[#8C6A38] transition-colors disabled:opacity-50">
                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL : Édition section
      ══════════════════════════════════════════════════════ */}
      {editingSection !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-gray-900">{editingSection.id ? 'Modifier la section' : 'Nouvelle section'}</h3>
              <button onClick={() => setEditingSection(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Scope */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Portée</label>
                <select value={editingSection.scope ?? 'shared'} onChange={e => setEditingSection(p => ({ ...p!, scope: e.target.value as 'shared' | 'apartment_specific' }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]">
                  <option value="shared">Commune aux 2 villas</option>
                  <option value="apartment_specific">Spécifique à cette villa</option>
                </select>
              </div>
              {/* Icône */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Icône</label>
                <button type="button" onClick={() => { setIconPickerTarget('section'); setShowIconPicker(true); }}
                  className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 text-sm hover:border-[#B08B52] transition-colors w-full">
                  <GuideIcon name={editingSection.icon_name} size={18} className="text-[#B08B52]" />
                  <span className="text-gray-600">{editingSection.icon_name ?? 'Choisir une icône'}</span>
                </button>
              </div>
              {/* Titre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Titre FR *</label>
                  <input value={editingSection.title_fr ?? ''} onChange={e => setEditingSection(p => ({ ...p!, title_fr: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="Titre en français" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Titre EN *</label>
                  <input value={editingSection.title_en ?? ''} onChange={e => setEditingSection(p => ({ ...p!, title_en: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" placeholder="Title in English" />
                </div>
              </div>
              {/* Sous-titre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Sous-titre FR</label>
                  <input value={editingSection.subtitle_fr ?? ''} onChange={e => setEditingSection(p => ({ ...p!, subtitle_fr: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Sous-titre EN</label>
                  <input value={editingSection.subtitle_en ?? ''} onChange={e => setEditingSection(p => ({ ...p!, subtitle_en: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" />
                </div>
              </div>
              {/* Intro */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Intro FR</label>
                  <textarea value={editingSection.intro_fr ?? ''} onChange={e => setEditingSection(p => ({ ...p!, intro_fr: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Intro EN</label>
                  <textarea value={editingSection.intro_en ?? ''} onChange={e => setEditingSection(p => ({ ...p!, intro_en: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52] resize-none" />
                </div>
              </div>
              {/* Ordre */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Ordre d&apos;affichage</label>
                <input type="number" value={editingSection.display_order ?? 50} onChange={e => setEditingSection(p => ({ ...p!, display_order: Number(e.target.value) }))}
                  className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52]" />
              </div>
              {/* Publié */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editingSection.is_published ?? true} onChange={e => setEditingSection(p => ({ ...p!, is_published: e.target.checked }))}
                  className="w-4 h-4 accent-[#B08B52]" />
                <span className="text-sm text-gray-700">Section publiée (visible côté voyageur)</span>
              </label>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setEditingSection(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Annuler</button>
              <button onClick={saveSection} disabled={saving || !editingSection.title_fr || !editingSection.title_en}
                className="flex items-center gap-2 px-5 py-2 bg-[#B08B52] text-white rounded-lg text-sm font-medium hover:bg-[#8C6A38] transition-colors disabled:opacity-50">
                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL : Sélecteur d'icônes
      ══════════════════════════════════════════════════════ */}
      {showIconPicker && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-gray-900 text-sm">Choisir une icône</h3>
              <button onClick={() => setShowIconPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-5 py-4 space-y-5">
              {GUIDE_ICON_GROUPS.map(group => (
                <div key={group}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</p>
                  <div className="grid grid-cols-6 gap-2">
                    {GUIDE_ICON_REGISTRY.filter(i => i.group === group).map(icon => (
                      <button
                        key={icon.name}
                        onClick={() => {
                          if (iconPickerTarget === 'section') {
                            setEditingSection(p => ({ ...p!, icon_name: icon.name }));
                          } else {
                            setEditingItem(p => ({ ...p!, icon_name: icon.name }));
                          }
                          setShowIconPicker(false);
                        }}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-[#B08B52] hover:bg-amber-50 transition-colors group"
                        title={icon.label_fr}
                      >
                        <GuideIcon name={icon.name} size={20} className="text-gray-500 group-hover:text-[#B08B52]" />
                        <span className="text-[8px] text-gray-400 group-hover:text-[#B08B52] text-center leading-tight">{icon.label_fr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sous-composants utilitaires ───────────────────────────────

function KeyInfoBlock({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <GuideIcon name={icon} size={15} className="text-[#B08B52]" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function KeyInfoField({
  label, value, onChange, placeholder, sensitive, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  sensitive?: boolean;
  multiline?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = sensitive && !show ? 'password' : 'text';

  return (
    <div className={multiline ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52] resize-none"
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#B08B52] pr-10"
          />
        )}
        {sensitive && !multiline && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
