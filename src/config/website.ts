export const websiteConfig = {
  name: 'TanStarter Cloud',
  description: 'A reusable full-stack product starter for Cloudflare Workers.',
  url: null as string | null,
  repository: 'https://github.com/MkFastHQ/mkfast-lite',
  defaultTheme: 'system' as const,
  themeStorageKey: 'tanstarter-cloud-theme',
  colors: {
    background: '#fff8e8',
    theme: '#ffd84a',
  },
  manifest: {
    id: '/',
    startUrl: '/',
    scope: '/',
  },
  navigation: [
    { id: 'stack', labelKey: 'nav_stack' },
    { id: 'structure', labelKey: 'nav_structure' },
    { id: 'faq', labelKey: 'nav_faq' },
  ],
};
