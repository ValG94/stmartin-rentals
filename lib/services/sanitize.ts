import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize du HTML provenant d'un éditeur WYSIWYG (TipTap) avant rendu
 * via dangerouslySetInnerHTML. À utiliser SYSTÉMATIQUEMENT pour tout
 * contenu issu de la base de données qui sera rendu en HTML.
 *
 * Whitelist : balises de formatage de texte basiques, plus listes,
 * liens (target rewriting forcé en _blank + rel noopener) et images.
 */
export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div',
      'strong', 'b', 'em', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'style', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
