'use client';

import { useState } from 'react';
import type { ApartmentKeyInfo } from '@/lib/api-guide';
import GuideIcon from './GuideIcon';

interface QuickAccessCardsProps {
  keyInfo: ApartmentKeyInfo;
  locale: string;
}

export default function QuickAccessCards({ keyInfo, locale }: QuickAccessCardsProps) {
  const isFr = locale === 'fr';

  const hasAnyCard = keyInfo.wifi_name || keyInfo.gate_code || keyInfo.alarm_code ||
    keyInfo.checkin_time || keyInfo.checkout_time || keyInfo.host_phone ||
    keyInfo.whatsapp || keyInfo.emergency_phone || keyInfo.fire_phone || keyInfo.map_link;

  if (!hasAnyCard) return null;

  return (
    <div>
      {/* Eyebrow */}
      <div className="flex items-center gap-4 mb-8">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] whitespace-nowrap">
          {isFr ? 'Accès rapide' : 'Quick access'}
        </p>
        <div className="h-px flex-1 bg-stone-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Wi-Fi */}
        {keyInfo.wifi_name && (
          <WifiCard
            name={keyInfo.wifi_name}
            password={keyInfo.wifi_password ?? null}
            isFr={isFr}
          />
        )}

        {/* Gate code */}
        {keyInfo.gate_code && (
          <SecretCard
            icon="key"
            label={isFr ? 'Code portail' : 'Gate code'}
            value={keyInfo.gate_code}
            accent="#B08B52"
            accentBg="rgba(176,139,82,0.08)"
            isFr={isFr}
          />
        )}

        {/* Alarm code */}
        {keyInfo.alarm_code && (
          <SecretCard
            icon="lock"
            label={isFr ? 'Code alarme' : 'Alarm code'}
            value={keyInfo.alarm_code}
            accent="#DC2626"
            accentBg="rgba(220,38,38,0.07)"
            isFr={isFr}
          />
        )}

        {/* Check-in */}
        {keyInfo.checkin_time && (
          <InfoCard
            icon="clock"
            label={isFr ? 'Arrivée' : 'Check-in'}
            value={keyInfo.checkin_time}
            accent="#059669"
            accentBg="rgba(5,150,105,0.08)"
          />
        )}

        {/* Check-out */}
        {keyInfo.checkout_time && (
          <InfoCard
            icon="clock"
            label={isFr ? 'Départ' : 'Check-out'}
            value={keyInfo.checkout_time}
            accent="#D97706"
            accentBg="rgba(217,119,6,0.08)"
          />
        )}

        {/* Host phone */}
        {keyInfo.host_phone && (
          <LinkCard
            icon="phone"
            label={isFr ? 'Contact hôte' : 'Host contact'}
            value={keyInfo.host_phone}
            href={`tel:${keyInfo.host_phone}`}
            accent="#0D1B2A"
            accentBg="rgba(13,27,42,0.07)"
          />
        )}

        {/* WhatsApp */}
        {keyInfo.whatsapp && (
          <LinkCard
            icon="message-circle"
            label="WhatsApp"
            value={keyInfo.whatsapp}
            href={`https://wa.me/${keyInfo.whatsapp.replace(/\D/g, '')}`}
            accent="#16A34A"
            accentBg="rgba(22,163,74,0.08)"
          />
        )}

        {/* SAMU */}
        {keyInfo.emergency_phone && (
          <LinkCard
            icon="phone"
            label={isFr ? 'SAMU / Ambulance' : 'SAMU / Ambulance'}
            value={keyInfo.emergency_phone}
            href={`tel:${keyInfo.emergency_phone}`}
            accent="#DC2626"
            accentBg="rgba(220,38,38,0.07)"
          />
        )}

        {/* Pompiers */}
        {keyInfo.fire_phone && (
          <LinkCard
            icon="phone"
            label={isFr ? 'Pompiers' : 'Fire dept.'}
            value={keyInfo.fire_phone}
            href={`tel:${keyInfo.fire_phone}`}
            accent="#EA580C"
            accentBg="rgba(234,88,12,0.08)"
          />
        )}

        {/* Maps */}
        {keyInfo.map_link && (
          <LinkCard
            icon="map-pin"
            label={isFr ? 'Localisation' : 'Location'}
            value={isFr ? 'Ouvrir dans Maps' : 'Open in Maps'}
            href={keyInfo.map_link}
            accent="#B08B52"
            accentBg="rgba(176,139,82,0.08)"
          />
        )}

      </div>
    </div>
  );
}

// ── Shared card shell ─────────────────────────────────────────
const cardClass = 'bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-300';

// ── Wi-Fi card ────────────────────────────────────────────────
function WifiCard({ name, password, isFr }: { name: string; password: string | null; isFr: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.09)' }}>
          <GuideIcon name="wifi" size={19} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-1.5">Wi-Fi</p>
          <p className="text-sm font-semibold text-[#0D1B2A] mb-3 truncate">{name}</p>
          {password && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-stone-400 font-light">{isFr ? 'Mot de passe' : 'Password'} :</span>
              <code className={`text-xs font-mono text-stone-700 transition-all duration-300 ${!revealed ? 'blur-sm select-none' : ''}`}>
                {password}
              </code>
              <button
                onClick={() => setRevealed(r => !r)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors font-medium"
              >
                {revealed ? (isFr ? 'Masquer' : 'Hide') : (isFr ? 'Afficher' : 'Show')}
              </button>
              {revealed && (
                <button
                  onClick={handleCopy}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                    copied ? 'bg-emerald-50 text-emerald-600' : 'bg-[#B08B52]/10 text-[#B08B52] hover:bg-[#B08B52]/20'
                  }`}
                >
                  {copied ? (isFr ? '✓ Copié' : '✓ Copied') : (isFr ? 'Copier' : 'Copy')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Secret card ───────────────────────────────────────────────
function SecretCard({
  icon, label, value, accent, accentBg, isFr,
}: {
  icon: string; label: string; value: string; accent: string; accentBg: string; isFr: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
          <GuideIcon name={icon} size={19} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className={`text-sm font-mono font-semibold text-[#0D1B2A] transition-all duration-300 ${!revealed ? 'blur-sm select-none' : ''}`}>
              {value}
            </code>
            <button
              onClick={() => setRevealed(r => !r)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors font-medium"
            >
              {revealed ? (isFr ? 'Masquer' : 'Hide') : (isFr ? 'Afficher' : 'Show')}
            </button>
            {revealed && (
              <button
                onClick={handleCopy}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600' : 'bg-[#B08B52]/10 text-[#B08B52] hover:bg-[#B08B52]/20'
                }`}
              >
                {copied ? (isFr ? '✓ Copié' : '✓ Copied') : (isFr ? 'Copier' : 'Copy')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Info card ─────────────────────────────────────────────────
function InfoCard({
  icon, label, value, accent, accentBg,
}: {
  icon: string; label: string; value: string; accent: string; accentBg: string;
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
          <GuideIcon name={icon} size={19} style={{ color: accent }} />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <p className="text-sm font-semibold text-[#0D1B2A]">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ── Link card ─────────────────────────────────────────────────
function LinkCard({
  icon, label, value, href, accent, accentBg,
}: {
  icon: string; label: string; value: string; href: string; accent: string; accentBg: string;
}) {
  const isExternal = href.startsWith('http');
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`${cardClass} hover:-translate-y-0.5 block`}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: accentBg }}>
          <GuideIcon name={icon} size={19} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <p className="text-sm font-semibold text-[#0D1B2A] truncate">{value}</p>
        </div>
      </div>
    </a>
  );
}
