import { readFile } from 'node:fs/promises';

const files = ['en', 'es', 'fr'].map(
  (locale) => `project.inlang/messages/${locale}.json`
);
const [base, ...translatedLocales] = await Promise.all(
  files.map(async (file) => JSON.parse(await readFile(file, 'utf8')))
);
const baseKeys = Object.keys(base).sort();

// Every configured locale must expose the exact base message surface so the
// generated Paraglide API cannot drift between languages.
for (const translated of translatedLocales) {
  const translatedKeys = Object.keys(translated).sort();

  if (JSON.stringify(baseKeys) !== JSON.stringify(translatedKeys)) {
    throw new Error('Locale files must contain exactly the same keys.');
  }
}

console.log(
  `Locale parity: ${baseKeys.length} keys across ${files.length} files.`
);
