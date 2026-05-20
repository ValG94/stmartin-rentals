'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Lock, Eye, EyeOff, Check, AlertCircle, KeyRound } from 'lucide-react';

export default function AdminSettingsPage() {
  const locale = useLocale();
  const isFr = locale === 'fr';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function validate(): string | null {
    if (!currentPassword) return isFr ? 'Mot de passe actuel requis' : 'Current password required';
    if (newPassword.length < 8) return isFr
      ? 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      : 'New password must be at least 8 characters';
    if (newPassword !== confirmPassword) return isFr
      ? 'Les mots de passe ne correspondent pas'
      : 'Passwords do not match';
    if (newPassword === currentPassword) return isFr
      ? 'Le nouveau mot de passe doit être différent de l\'ancien'
      : 'New password must differ from the current one';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isFr ? 'Une erreur est survenue' : 'An error occurred'));
      }
      setSuccess(isFr ? 'Mot de passe mis à jour avec succès' : 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 bg-sand-100 min-h-full">

      {/* En-tête */}
      <div className="mb-10">
        <p className="section-label mb-2">{isFr ? 'Compte' : 'Account'}</p>
        <h1 className="font-serif font-light text-night-600 text-3xl md:text-4xl leading-tight">
          {isFr ? 'Mon compte' : 'My account'}
        </h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-cream-100 rounded-2xl border border-bronze-100 p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-bronze-100">
            <KeyRound size={20} className="text-bronze-500" />
            <div>
              <h2 className="font-serif text-xl text-night-600">
                {isFr ? 'Changer le mot de passe' : 'Change password'}
              </h2>
              <p className="text-sm text-night-400 font-light mt-1">
                {isFr
                  ? 'Choisissez un mot de passe d\'au moins 8 caractères.'
                  : 'Pick a password of at least 8 characters.'}
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2" role="status">
              <Check size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <PasswordField
              label={isFr ? 'Mot de passe actuel' : 'Current password'}
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(s => !s)}
              autoComplete="current-password"
            />

            <PasswordField
              label={isFr ? 'Nouveau mot de passe' : 'New password'}
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(s => !s)}
              autoComplete="new-password"
              hint={isFr ? 'Minimum 8 caractères' : 'At least 8 characters'}
            />

            <PasswordField
              label={isFr ? 'Confirmer le nouveau mot de passe' : 'Confirm new password'}
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(s => !s)}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-night-600 hover:bg-night-500 text-cream-100 font-sans text-xs uppercase py-4 transition-colors duration-300 disabled:opacity-50 rounded-md mt-4"
              style={{ letterSpacing: '0.2em' }}
            >
              {loading
                ? (isFr ? 'Mise à jour…' : 'Updating…')
                : (isFr ? 'Mettre à jour le mot de passe' : 'Update password')}
            </button>
          </form>
        </div>

        {/* Note info */}
        <div className="mt-6 bg-cream-50 border border-bronze-100 rounded-lg p-5 text-sm text-night-500 font-light leading-relaxed">
          <p>
            <strong className="text-night-600">{isFr ? 'Sécurité' : 'Security'} :</strong>{' '}
            {isFr
              ? 'Votre mot de passe est chiffré et stocké de manière sécurisée. Il ne peut être consulté par personne, ni par l\'équipe technique. En cas d\'oubli, contactez votre administrateur technique.'
              : 'Your password is encrypted and stored securely. Nobody can read it, not even the technical team. If you forget it, contact your technical administrator.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, autoComplete, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-night-500 uppercase mb-2" style={{ letterSpacing: '0.15em' }}>
        {label}
      </label>
      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-bronze-400" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          className="w-full pl-11 pr-12 py-3 bg-white border border-bronze-100 rounded-md text-sm text-night-600 focus:outline-none focus:border-bronze-400 focus:ring-1 focus:ring-bronze-400 transition-colors"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-night-300 hover:text-night-600 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-night-400 mt-1.5 font-light">{hint}</p>}
    </div>
  );
}
