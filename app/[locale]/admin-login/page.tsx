'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Client Supabase côté client — utilise les variables NEXT_PUBLIC_ disponibles dans le bundle
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.session) {
        setError(locale === 'fr' ? 'Identifiants incorrects' : 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Stocker le token en localStorage pour l'état UI
      localStorage.setItem('sb-admin-token', data.user.id);
      router.push(`/${locale}/admin/dashboard`);
    } catch {
      setError(locale === 'fr' ? 'Erreur de connexion' : 'Connection error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-600 flex items-center justify-center px-4">
      {/* Fond décoratif */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-bronze-400 to-transparent pointer-events-none" />

      <div className="relative bg-cream-100 p-10 w-full max-w-md shadow-2xl">
        {/* Ligne bronze décorative */}
        <div className="h-0.5 bg-bronze-400 w-12 mb-8" />

        <div className="mb-8">
          <div className="font-serif font-light text-night-600 text-2xl mb-1" style={{letterSpacing:'-0.01em'}}>
            StMartin Rentals
          </div>
          <p className="font-sans text-xs text-night-400 uppercase" style={{letterSpacing:'0.2em'}}>
            {locale === 'fr' ? 'Espace Administration' : 'Admin Area'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block font-sans text-xs font-medium text-night-400 uppercase mb-2" style={{letterSpacing:'0.15em'}}>
              {locale === 'fr' ? 'Adresse e-mail' : 'Email address'}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-night-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3.5 border border-night-200/30 bg-white font-sans text-sm text-night-600 focus:outline-none focus:border-bronze-400 transition-colors"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block font-sans text-xs font-medium text-night-400 uppercase mb-2" style={{letterSpacing:'0.15em'}}>
              {locale === 'fr' ? 'Mot de passe' : 'Password'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-night-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3.5 border border-night-200/30 bg-white font-sans text-sm text-night-600 focus:outline-none focus:border-bronze-400 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-night-300 hover:text-night-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="border border-red-200 bg-red-50 text-red-700 font-sans text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-night-600 hover:bg-night-500 text-cream-100 font-sans text-xs uppercase py-4 transition-colors duration-300 disabled:opacity-50 mt-2"
            style={{letterSpacing:'0.2em'}}
          >
            {loading
              ? (locale === 'fr' ? 'Connexion...' : 'Signing in...')
              : (locale === 'fr' ? 'Se connecter' : 'Sign in')}
          </button>
        </form>

        {/* Ligne bronze décorative bas */}
        <div className="h-0.5 bg-bronze-400/30 w-full mt-10" />
      </div>
    </div>
  );
}
