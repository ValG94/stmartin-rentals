'use client';

import { useState } from 'react';
import type { ApartmentKeyInfo } from '@/lib/api-guide';
import GuideIcon from './GuideIcon';

interface QuickAccessCardsProps {
  keyInfo: ApartmentKeyInfo;
  locale: string;
}

interface SensitiveCardProps {
  icon: string;
  label: string;
  value: string;
  accentColor: string;
}

function SensitiveCard({ icon, label, value, accentColor }: SensitiveCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentColor}`}>
          <GuideIcon name={icon} size={17} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className={`flex-1 text-sm font-mono font-semibold text-gray-800 transition-all duration-200 ${!revealed ? 'blur-sm select-none' : ''}`}>
          {value}
        </code>
        <button
          onClick={() => setRevealed(r => !r)}
          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {revealed ? 'Masquer' : 'Afficher'}
        </button>
        {revealed && (
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
              ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-[#B08B52]/10 text-[#B08B52] hover:bg-[#B08B52]/20'}`}
          >
            {copied ? '✓ Copié' : 'Copier'}
          </button>
        )}
      </div>
    </div>
  );
}

interface SimpleCardProps {
  icon: string;
  label: string;
  value: string;
  accentColor: string;
  href?: string;
}

function SimpleCard({ icon, label, value, accentColor, href }: SimpleCardProps) {
  const content = (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentColor}`}>
          <GuideIcon name={icon} size={17} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 group-hover:text-[#B08B52] transition-colors">{value}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

export default function QuickAccessCards({ keyInfo, locale }: QuickAccessCardsProps) {
  const isFr = locale === 'fr';

  const hasAnyCard = keyInfo.wifi_name || keyInfo.wifi_password || keyInfo.gate_code ||
    keyInfo.alarm_code || keyInfo.checkin_time || keyInfo.checkout_time ||
    keyInfo.host_phone || keyInfo.whatsapp || keyInfo.map_link;

  if (!hasAnyCard) return null;

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">
        {isFr ? 'Accès rapide' : 'Quick access'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Wi-Fi */}
        {keyInfo.wifi_name && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                <GuideIcon name="wifi" size={17} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Wi-Fi</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{keyInfo.wifi_name}</p>
            {keyInfo.wifi_password && (
              <SensitiveInline
                value={keyInfo.wifi_password}
                label={isFr ? 'Mot de passe' : 'Password'}
              />
            )}
          </div>
        )}

        {/* Gate code */}
        {keyInfo.gate_code && (
          <SensitiveCard
            icon="key"
            label={isFr ? 'Code portail' : 'Gate code'}
            value={keyInfo.gate_code}
            accentColor="bg-amber-500"
          />
        )}

        {/* Alarm code */}
        {keyInfo.alarm_code && (
          <SensitiveCard
            icon="lock"
            label={isFr ? 'Code alarme' : 'Alarm code'}
            value={keyInfo.alarm_code}
            accentColor="bg-red-500"
          />
        )}

        {/* Check-in */}
        {keyInfo.checkin_time && (
          <SimpleCard
            icon="clock"
            label={isFr ? 'Arrivée' : 'Check-in'}
            value={keyInfo.checkin_time}
            accentColor="bg-emerald-500"
          />
        )}

        {/* Check-out */}
        {keyInfo.checkout_time && (
          <SimpleCard
            icon="clock"
            label={isFr ? 'Départ' : 'Check-out'}
            value={keyInfo.checkout_time}
            accentColor="bg-orange-500"
          />
        )}

        {/* Host phone */}
        {keyInfo.host_phone && (
          <SimpleCard
            icon="phone"
            label={isFr ? 'Contact hôte' : 'Host contact'}
            value={keyInfo.host_phone}
            accentColor="bg-[#0D1B2A]"
            href={`tel:${keyInfo.host_phone}`}
          />
        )}

        {/* WhatsApp */}
        {keyInfo.whatsapp && (
          <SimpleCard
            icon="phone"
            label="WhatsApp"
            value={keyInfo.whatsapp}
            accentColor="bg-green-600"
            href={`https://wa.me/${keyInfo.whatsapp.replace(/\D/g, '')}`}
          />
        )}

        {/* Maps */}
        {keyInfo.map_link && (
          <SimpleCard
            icon="map-pin"
            label={isFr ? 'Localisation' : 'Location'}
            value={isFr ? 'Ouvrir dans Maps' : 'Open in Maps'}
            accentColor="bg-[#B08B52]"
            href={keyInfo.map_link}
          />
        )}
      </div>
    </div>
  );
}

// Inline sensitive value (pour le mot de passe Wi-Fi)
function SensitiveInline({ value, label }: { value: string; label: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-400">{label} :</span>
      <code className={`text-xs font-mono text-gray-700 transition-all duration-200 ${!revealed ? 'blur-sm select-none' : ''}`}>
        {value}
      </code>
      <button onClick={() => setRevealed(r => !r)} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
        {revealed ? '●' : '○'}
      </button>
      {revealed && (
        <button onClick={handleCopy} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-[#B08B52]/10 text-[#B08B52] hover:bg-[#B08B52]/20'}`}>
          {copied ? '✓' : 'Copier'}
        </button>
      )}
    </div>
  );
}
