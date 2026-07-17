#!/usr/bin/env node
// ============================================================
// scripts/update-technical-doc.mjs
// ============================================================
//
// Régénère les blocs `<!-- AUTO:* -->` de TECHNICAL.md à partir des données
// git en local. Appelé automatiquement par le hook pre-commit — le doc est
// staged puis inclus dans le commit en cours.
//
// Blocs actuellement gérés :
//   AUTO:META           → date de dernière mise à jour + branche
//   AUTO:LAST_COMMITS   → les 15 derniers commits (message + hash + auteur + date)
//
// Ajouter un nouveau bloc :
//   1. Ajouter `<!-- AUTO:MON_BLOC --><!-- /AUTO:MON_BLOC -->` dans TECHNICAL.md
//   2. Ajouter une entrée dans SECTIONS ci-dessous
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOC_PATH = join(__dirname, '..', 'TECHNICAL.md');

// execFileSync (pas de shell) — évite que cmd.exe sur Windows interprète
// les `%as`/`%h` du format git comme des variables d'environnement.
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// ── Générateurs de contenu par bloc ────────────────────────────────────────

function generateMeta() {
  const now = new Date();
  const iso = now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD') || 'unknown';
  const shortSha = git('rev-parse', '--short', 'HEAD') || 'pending';
  return [
    '',
    `> **Dernière mise à jour** : ${iso}`,
    `> **Branche** : \`${branch}\` — **HEAD** : \`${shortSha}\``,
    '',
  ].join('\n');
}

function generateLastCommits() {
  // format: hash|date|author|subject (utilise un séparateur `` pour
  // éviter les collisions avec des `|` dans les messages de commit)
  const SEP = '';
  const raw = git('log', '-n', '15', `--pretty=format:%h${SEP}%as${SEP}%an${SEP}%s`);
  if (!raw) return '\n_(aucun commit)_\n';

  const lines = raw.split('\n').map((l) => {
    const parts = l.split(SEP);
    const [hash, date, author, ...rest] = parts;
    const subject = rest.join(SEP).replace(/\|/g, '\\|');
    return `| \`${hash}\` | ${date} | ${author} | ${subject} |`;
  });

  return [
    '',
    '| Hash | Date | Auteur | Sujet |',
    '|---|---|---|---|',
    ...lines,
    '',
  ].join('\n');
}

const SECTIONS = {
  META: generateMeta,
  LAST_COMMITS: generateLastCommits,
};

// ── Remplacement des blocs ─────────────────────────────────────────────────

let content;
try {
  content = readFileSync(DOC_PATH, 'utf8');
} catch (e) {
  console.error(`[update-technical-doc] TECHNICAL.md introuvable : ${e.message}`);
  process.exit(0); // n'échoue pas le commit si le doc n'existe pas
}

let updated = content;
for (const [name, generator] of Object.entries(SECTIONS)) {
  const open = `<!-- AUTO:${name} -->`;
  const close = `<!-- /AUTO:${name} -->`;
  const re = new RegExp(
    `${open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'g'
  );
  const body = generator();
  const replacement = `${open}${body}${close}`;
  if (re.test(updated)) {
    updated = updated.replace(re, replacement);
  } else {
    // Bloc absent → on n'ajoute rien silencieusement, juste un warning
    console.warn(`[update-technical-doc] bloc AUTO:${name} absent de TECHNICAL.md`);
  }
}

if (updated !== content) {
  writeFileSync(DOC_PATH, updated, 'utf8');
  console.log('[update-technical-doc] TECHNICAL.md mis à jour');
} else {
  console.log('[update-technical-doc] aucun changement');
}
