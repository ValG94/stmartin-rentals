import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Exclure les routes API, _next, _vercel et les fichiers statiques du middleware i18n
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
