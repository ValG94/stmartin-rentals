import { getTranslations, getLocale } from 'next-intl/server';
import VillaCard from '@/components/apartments/VillaCard';
import VillaCardFallback from '@/components/apartments/VillaCardFallback';
import Link from 'next/link';
import Image from 'next/image';
import { getApartments } from '@/lib/api';
import { MapPin, ArrowRight, Star, Shield, Phone, ChevronDown } from 'lucide-react';

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const res = await getApartments();
  const apartments = res.data ?? [];
  const isFr = locale === 'fr';

  return (
    <div className="bg-cream-100">

      {/* HERO */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/villa-vanille/vue piscine drone.jpeg" alt="Villa luxe Saint-Martin" fill className="object-cover" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-b from-night-600/50 via-night-600/20 to-night-600/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-night-600/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 text-white/80 font-sans text-xs uppercase" style={{letterSpacing:'0.25em'}}>
            <MapPin size={12} className="text-bronze-300" />
            <span>Saint-Martin, Deutch Side</span>
          </div>
          <h1 className="font-serif font-light text-white mb-6 leading-none" style={{fontSize:'clamp(3.5rem, 9vw, 8rem)', letterSpacing:'-0.02em'}}>
            {isFr ? <>L&apos;art de vivre<br /><em className="font-light italic">caraïbe</em></> : <>The art of<br /><em className="font-light italic">Caribbean living</em></>}
          </h1>
          <p className="font-sans font-light text-white/80 mb-12 max-w-xl mx-auto leading-relaxed" style={{fontSize:'clamp(0.9rem, 2vw, 1.1rem)', letterSpacing:'0.02em'}}>
            {isFr ? "Deux villas d'exception à Saint-Martin. Piscine privée, vue mer, expérience sur-mesure." : "Two exceptional villas in Saint-Martin. Private pool, sea view, bespoke experience."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={`/${locale}/apartments`} className="btn-secondary">{isFr ? 'Découvrir nos villas' : 'Discover our villas'}</Link>
            <Link href={`/${locale}/contact`} className="btn-secondary" style={{borderColor:'rgba(255,255,255,0.3)'}}>{isFr ? 'Nous contacter' : 'Contact us'}</Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <ChevronDown size={20} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10">
          <div className="max-w-3xl mx-auto px-6 py-5 grid grid-cols-3 gap-4 text-white text-center">
            <div>
              <div className="font-serif text-3xl font-light">2</div>
              <div className="font-sans text-xs text-white/60 mt-1 uppercase" style={{letterSpacing:'0.15em'}}>{isFr ? "Villas d'exception" : 'Exceptional villas'}</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-light">4.9<span className="text-bronze-300 text-xl">★</span></div>
              <div className="font-sans text-xs text-white/60 mt-1 uppercase" style={{letterSpacing:'0.15em'}}>{isFr ? 'Note 5 étoiles' : '5-star rating'}</div>
            </div>
            <div>
              <div className="font-serif text-3xl font-light">100%</div>
              <div className="font-sans text-xs text-white/60 mt-1 uppercase" style={{letterSpacing:'0.15em'}}>Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNATURE */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="section-label mb-6">{isFr ? 'Notre histoire' : 'Our story'}</p>
              <div className="divider-bronze mb-8" />
              <h2 className="font-serif font-light text-night-600 mb-8 leading-tight" style={{fontSize:'clamp(2.2rem, 4vw, 3.2rem)', letterSpacing:'-0.01em'}}>
                {isFr ? <>Une expérience<br /><em className="italic">au-delà du séjour</em></> : <>An experience<br /><em className="italic">beyond the stay</em></>}
              </h2>
              <p className="font-sans text-night-400 leading-relaxed mb-6" style={{fontSize:'1.05rem'}}>
                {isFr ? "StMartin Rentals est né d'une passion pour Saint-Martin et d'une conviction : chaque séjour mérite d'être une expérience inoubliable. Nos villas ne sont pas de simples locations — elles sont des écrins de vie, pensés dans les moindres détails pour vous offrir le meilleur des Caraïbes." : "StMartin Rentals was born from a passion for Saint-Martin and a conviction: every stay deserves to be an unforgettable experience. Our villas are not just rentals — they are living gems, designed in every detail to offer you the best of the Caribbean."}
              </p>
              <p className="font-sans text-night-400 leading-relaxed" style={{fontSize:'1.05rem'}}>
                {isFr ? "Piscine privée, vue mer, architecture soignée, accueil personnalisé — nous créons les conditions d'une évasion totale." : "Private pool, sea view, refined architecture, personalized welcome — we create the conditions for total escape."}
              </p>
            </div>
            <div className="relative">
              <div className="relative h-[500px] overflow-hidden">
                <Image src="/images/villa-vanille/chambre-vue-mer.jpg" alt="Villa Vanille" fill className="object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-night-600 text-cream-100 p-6 hidden lg:block">
                <div className="font-serif text-3xl font-light">4.9★</div>
                <div className="font-sans text-xs text-cream-100/60 mt-1 uppercase" style={{letterSpacing:'0.15em'}}>{isFr ? 'Note moyenne' : 'Average rating'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VILLAS */}
      <section className="py-24 px-6 bg-night-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label text-bronze-300 mb-4">{isFr ? 'Nos propriétés' : 'Our properties'}</p>
            <div className="divider-bronze mx-auto mb-6" />
            <h2 className="font-serif font-light text-cream-100 leading-tight" style={{fontSize:'clamp(2rem, 4vw, 3.5rem)', letterSpacing:'-0.01em'}}>
              {isFr ? "Deux villas d'exception" : 'Two exceptional villas'}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {apartments.length > 0 ? apartments.map((apt, index) => (
              <VillaCard key={apt.id} apartment={apt} index={index} />
            )) : [
              {slug:'villa-vanille', title:'La Villa Vanille', desc: isFr ? 'Villa de prestige avec piscine à débordement et vue mer panoramique' : 'Prestige villa with infinity pool and panoramic sea view', img:'/images/villa-vanille/piscine-terrasse.jpg', price:1500, bedrooms:3, bathrooms:3, guests:6, location:'Terres Basses, Saint-Martin'},
              {slug:'villa-blanche', title:'La Villa Blanche', desc: isFr ? 'Villa intimiste avec piscine privée et vue sur le lagon turquoise' : 'Intimate villa with private pool and turquoise lagoon view', img:'/images/villa-blanche/piscine.jpg', price:480, bedrooms:2, bathrooms:2, guests:4, location:'Sandy Ground, Saint-Martin'},
            ].map((villa, index) => (
              <VillaCardFallback key={villa.slug} villa={villa} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* EXPÉRIENCE */}
      <section className="py-32 px-6 bg-sand-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-4">{isFr ? "L'expérience StMartin" : 'The StMartin experience'}</p>
            <div className="divider-bronze mx-auto mb-6" />
            <h2 className="font-serif font-light text-night-600 leading-tight" style={{fontSize:'clamp(2rem, 4vw, 3.2rem)', letterSpacing:'-0.01em'}}>
              {isFr ? 'Tout est pensé pour vous' : 'Everything is designed for you'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-night-200/20">
            {[
              {icon:'🔑', title: isFr ? 'Arrivée simplifiée' : 'Easy check-in', desc: isFr ? 'Accueil personnalisé, remise des clés et présentation de la villa à votre arrivée.' : 'Personal welcome, key handover and villa presentation on arrival.'},
              {icon:'📶', title:'Wi-Fi Premium', desc: isFr ? 'Connexion haut débit dans toute la villa, idéale pour le télétravail ou le streaming.' : 'High-speed connection throughout the villa, ideal for remote work or streaming.'},
              {icon:'📱', title: isFr ? 'Guide digital' : 'Digital guide', desc: isFr ? 'Un guide complet de votre villa et de Saint-Martin accessible depuis votre smartphone.' : 'A complete guide to your villa and Saint-Martin accessible from your smartphone.'},
              {icon:'🏊', title: isFr ? 'Piscine privée' : 'Private pool', desc: isFr ? 'Chaque villa dispose de sa propre piscine, entretenue quotidiennement pour votre confort.' : 'Each villa has its own pool, maintained daily for your comfort.'},
              {icon:'🌊', title: isFr ? 'Vue mer & lagon' : 'Sea & lagoon view', desc: isFr ? 'Des vues imprenables sur la mer des Caraïbes depuis les terrasses et les chambres.' : 'Breathtaking views of the Caribbean Sea from the terraces and bedrooms.'},
              {icon:'🛎️', title: isFr ? 'Assistance locale' : 'Local assistance', desc: isFr ? "Notre équipe est disponible 7j/7 pour répondre à vos besoins et vous conseiller." : 'Our team is available 7 days a week to meet your needs and advise you.'},
            ].map((service, i) => (
              <div key={i} className="bg-cream-100 p-10 group hover:bg-night-600 transition-colors duration-500">
                <div className="text-3xl mb-6">{service.icon}</div>
                <h3 className="font-serif font-light text-night-600 group-hover:text-cream-100 mb-4 transition-colors duration-500" style={{fontSize:'1.4rem', letterSpacing:'-0.01em'}}>{service.title}</h3>
                <p className="font-sans text-sm text-night-400 group-hover:text-cream-100/70 leading-relaxed transition-colors duration-500">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATION */}
      <section className="py-32 px-6 bg-cream-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="relative h-[450px] overflow-hidden">
                <Image src="/images/villa-blanche/vue-lagon.jpg" alt="Saint-Martin lagon" fill className="object-cover" />
              </div>
              <div className="absolute -bottom-8 -right-8 w-48 h-48 overflow-hidden hidden lg:block border-4 border-cream-100">
                <Image src="/images/villa-vanille/exterieur.jpg" alt="Villa extérieur" fill className="object-cover" />
              </div>
            </div>
            <div>
              <p className="section-label mb-6">{isFr ? 'La destination' : 'The destination'}</p>
              <div className="divider-bronze mb-8" />
              <h2 className="font-serif font-light text-night-600 mb-8 leading-tight" style={{fontSize:'clamp(2rem, 4vw, 3.2rem)', letterSpacing:'-0.01em'}}>
                {isFr ? <>Saint-Martin,<br /><em className="italic">l&apos;île aux deux visages</em></> : <>Saint-Martin,<br /><em className="italic">the island of two faces</em></>}
              </h2>
              <p className="font-sans text-night-400 leading-relaxed mb-6" style={{fontSize:'1.05rem'}}>
                {isFr ? "Partagée entre la France et les Pays-Bas, Saint-Martin est une île unique aux Caraïbes. Plages de sable blanc, lagons turquoise, gastronomie raffinée, vie nocturne animée — elle réunit tous les ingrédients d'un séjour parfait." : "Shared between France and the Netherlands, Saint-Martin is a unique island in the Caribbean. White sand beaches, turquoise lagoons, refined gastronomy, vibrant nightlife — it brings together all the ingredients for a perfect stay."}
              </p>
              <p className="font-sans text-night-400 leading-relaxed mb-10" style={{fontSize:'1.05rem'}}>
                {isFr ? "Depuis nos villas, vous êtes à quelques minutes des plus belles plages : Baie Rouge, Orient Bay, Friar's Bay... et des meilleurs restaurants de l'île." : "From our villas, you are just minutes from the most beautiful beaches: Baie Rouge, Orient Bay, Friar's Bay... and the best restaurants on the island."}
              </p>
              <Link href={`/${locale}/apartments`} className="btn-primary">{isFr ? 'Réserver votre villa' : 'Book your villa'}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 px-6 bg-night-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image src="/images/villa-vanille/piscine-terrasse.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="section-label text-bronze-300 mb-6">{isFr ? 'Réservation directe' : 'Direct booking'}</p>
          <div className="divider-bronze mx-auto mb-8" />
          <h2 className="font-serif font-light text-cream-100 mb-8 leading-tight" style={{fontSize:'clamp(2rem, 4vw, 3.5rem)', letterSpacing:'-0.01em'}}>
            {isFr ? <>Prêt pour votre<br /><em className="italic">évasion caraïbe ?</em></> : <>Ready for your<br /><em className="italic">Caribbean escape?</em></>}
          </h2>
          <p className="font-sans text-cream-100/60 mb-12 leading-relaxed" style={{fontSize:'1.05rem'}}>
            {isFr ? "Réservez directement auprès de nous pour les meilleurs tarifs. Paiement sécurisé, acompte ou paiement total selon votre préférence." : "Book directly with us for the best rates. Secure payment, deposit or full payment according to your preference."}
          </p>
          <div className="grid grid-cols-3 gap-6 mb-12">
            {[
              {icon:<Shield size={20} />, label: isFr ? 'Paiement sécurisé' : 'Secure payment'},
              {icon:<Star size={20} />, label: isFr ? 'Meilleur prix garanti' : 'Best price guaranteed'},
              {icon:<Phone size={20} />, label: isFr ? 'Assistance 7j/7' : '7/7 support'},
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="text-bronze-300">{item.icon}</div>
                <span className="font-sans text-xs text-cream-100/50 uppercase" style={{letterSpacing:'0.15em'}}>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/apartments`} className="btn-bronze">{isFr ? 'Voir les disponibilités' : 'Check availability'}</Link>
            <Link href={`/${locale}/contact`} className="btn-secondary">{isFr ? 'Nous écrire' : 'Write to us'}</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
