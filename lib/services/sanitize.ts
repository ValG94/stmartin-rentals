import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize du HTML provenant d'un éditeur WYSIWYG (TipTap) avant rendu
 * via dangerouslySetInnerHTML. À utiliser SYSTÉMATIQUEMENT pour tout
 * contenu issu de la base de données qui sera rendu en HTML.
 *
 * Whitelist : balises de formatage de texte basiques, plus listes,
 * liens (forcés en target="_blank" + rel="noopener noreferrer") et images.
 */
export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeHtml(input, {
    allowedTags: [
      'p', 'br', 'span', 'div',
      'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre', 'hr',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['style', 'class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      // Force tous les liens à s'ouvrir en nouvelle fenêtre, en mode sûr
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
    // Empêche l'utilisation de styles inline dangereux (expression, javascript:, etc.)
    allowedStyles: {
      '*': {
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/, /^[a-z-]+$/i],
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        'font-weight': [/^\d+$/, /^bold$/, /^normal$/],
        'font-style': [/^italic$/, /^normal$/],
        'text-decoration': [/^underline$/, /^line-through$/, /^none$/],
      },
    },
  });
}
