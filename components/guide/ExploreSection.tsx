'use client';

import { useState } from 'react';
import { activities, itinerary, ActivityCategory } from '@/lib/data/explore-content';
import ActivityCard from './ActivityCard';
import CategoryFilter from './CategoryFilter';
import ItineraryDay from './ItineraryDay';

interface ExploreSectionProps {
  locale: string;
}

export default function ExploreSection({ locale }: ExploreSectionProps) {
  const [activeCategory, setActiveCategory] = useState<ActivityCategory | 'All'>('All');

  const isFr = locale === 'fr';

  const filteredActivities =
    activeCategory === 'All'
      ? activities
      : activities.filter((a) => a.categories.includes(activeCategory));

  return (
    <section className="mt-10 space-y-16">

      {/* ─── HERO BLOCK ──────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-night-600 via-night-700 to-night-800" />
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(176,139,82,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.08),_transparent_60%)]" />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze-400/60 to-transparent" />

        <div className="relative px-6 py-12 sm:px-10 sm:py-16 text-center">
          {/* Eyebrow */}
          <p className="text-bronze-400 text-xs font-medium tracking-[0.3em] uppercase mb-4">
            {isFr ? 'Guide de l\'île' : 'Island Guide'}
          </p>

          {/* Title */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {isFr ? 'Explorer Saint-Martin' : 'Explore Saint Martin'}
          </h2>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-bronze-400/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-bronze-400/60" />
            <div className="h-px w-12 bg-bronze-400/40" />
          </div>

          {/* Intro */}
          <p className="text-white/65 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {isFr
              ? 'Découvrez le meilleur de Sint Maarten / Saint-Martin grâce à cette sélection d\'excursions incontournables, d\'escapades balnéaires, d\'activités aventure et d\'expériences culinaires locales. Que vous souhaitiez vous détendre, explorer ou profiter de la mer, voici notre guide recommandé pour vivre un séjour inoubliable.'
              : 'Discover the best of Sint Maarten / Saint Martin with this curated selection of must-do excursions, beach escapes, adventure activities, and local food experiences. Whether you want to relax, explore or enjoy the sea, here is our recommended island guide for a memorable stay.'}
          </p>
        </div>
      </div>

      {/* ─── TOP EXPERIENCES ─────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="mb-8 text-center">
          <p className="text-bronze-400 text-xs font-medium tracking-[0.3em] uppercase mb-2">
            {isFr ? 'Sélection curatée' : 'Curated selection'}
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-6">
            {isFr ? 'Les Meilleures Expériences' : 'Top Experiences'}
          </h3>

          {/* Category filter */}
          <CategoryFilter
            locale={locale}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* Activities grid */}
        <div
          key={activeCategory}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {filteredActivities.map((activity, i) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              locale={locale}
              index={i}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredActivities.length === 0 && (
          <div className="text-center py-12 text-white/30 text-sm">
            {isFr ? 'Aucune activité dans cette catégorie.' : 'No activities in this category.'}
          </div>
        )}
      </div>

      {/* ─── 7-DAY ITINERARY ─────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="mb-10 text-center">
          <p className="text-bronze-400 text-xs font-medium tracking-[0.3em] uppercase mb-2">
            {isFr ? 'Planning conseillé' : 'Suggested planning'}
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
            {isFr ? 'Itinéraire 7 Jours' : '7-Day Itinerary'}
          </h3>
          <p className="text-white/45 text-sm max-w-md mx-auto">
            {isFr
              ? 'Un programme idéal pour profiter de chaque facette de l\'île.'
              : 'An ideal programme to experience every facet of the island.'}
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-2xl mx-auto">
          {itinerary.map((day, i) => (
            <ItineraryDay
              key={day.day}
              day={day}
              locale={locale}
              isLast={i === itinerary.length - 1}
            />
          ))}
        </div>
      </div>

      {/* ─── CTA BLOCK ───────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bronze-600/20 via-night-700 to-night-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(176,139,82,0.12),_transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze-400/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze-400/20 to-transparent" />

        <div className="relative px-6 py-10 sm:px-10 sm:py-12 text-center">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-bronze-400/15 border border-bronze-400/25
                          flex items-center justify-center text-2xl mx-auto mb-5">
            🧭
          </div>

          <h4 className="font-serif text-xl sm:text-2xl font-bold text-white mb-3">
            {isFr
              ? 'Besoin d\'aide pour choisir les meilleures excursions ?'
              : 'Need help choosing the best excursion?'}
          </h4>

          <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
            {isFr
              ? 'Notre équipe est disponible pour vous conseiller et organiser vos activités sur mesure.'
              : 'Our team is available to advise you and arrange your activities on request.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/15149476100"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-bronze-400 hover:bg-bronze-300 text-night-600 font-semibold text-sm
                         transition-all duration-300 hover:shadow-lg hover:shadow-bronze-400/20
                         tracking-wide"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:contact@islandlivingsxm.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-transparent border border-white/20 hover:border-bronze-400/50
                         text-white/80 hover:text-white font-medium text-sm
                         transition-all duration-300 tracking-wide"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              contact@islandlivingsxm.com
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
