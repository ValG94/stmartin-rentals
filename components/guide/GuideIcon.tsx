import {
  Info, Home, Key, Lock, Wifi, Phone, Mail, MapPin, Clock, Calendar,
  Sun, Moon, Utensils, Coffee, Car, ShoppingBag, Tv, Thermometer,
  Droplets, Flame, Sailboat, Waves, Plane, Zap, Map, Compass,
  Sunset, Mountain, Bike, AlertCircle, Shield, Heart, Star, Bookmark, Link,
  LucideProps,
} from 'lucide-react';
import { FALLBACK_ICON } from '@/lib/guide-icons';

// Registre fermé : nom → composant Lucide
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  'info':         Info,
  'home':         Home,
  'key':          Key,
  'lock':         Lock,
  'wifi':         Wifi,
  'phone':        Phone,
  'mail':         Mail,
  'map-pin':      MapPin,
  'clock':        Clock,
  'calendar':     Calendar,
  'sun':          Sun,
  'moon':         Moon,
  'utensils':     Utensils,
  'coffee':       Coffee,
  'car':          Car,
  'shopping-bag': ShoppingBag,
  'tv':           Tv,
  'thermometer':  Thermometer,
  'droplets':     Droplets,
  'flame':        Flame,
  'sailboat':     Sailboat,
  'waves':        Waves,
  'island':       MapPin,   // pas d'icône "island" dans Lucide → MapPin
  'plane':        Plane,
  'zap':          Zap,
  'map':          Map,
  'compass':      Compass,
  'sunset':       Sunset,
  'mountain':     Mountain,
  'bike':         Bike,
  'alert-circle': AlertCircle,
  'shield':       Shield,
  'heart':        Heart,
  'star':         Star,
  'bookmark':     Bookmark,
  'link':         Link,
};

interface GuideIconProps extends Omit<LucideProps, 'name'> {
  name: string | null | undefined;
}

export default function GuideIcon({ name, ...props }: GuideIconProps) {
  const iconName = name && ICON_MAP[name] ? name : FALLBACK_ICON;
  const IconComponent = ICON_MAP[iconName] ?? Info;
  return <IconComponent {...props} />;
}
