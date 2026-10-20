export const websiteConfig = {
  name: 'TanStarter Cloud',
  description: 'A reusable full-stack product starter for Cloudflare Workers.',
  url: null as string | null,
  repository: 'https://github.com/MkFastHQ/mkfast-lite',
  // Downstream projects replace this single value to update every support
  // contact link rendered by the public site.
  supportEmail: 'support@xx.com',
  // tawk.to's public property/widget address is shared by every route. It is
  // safe to expose in the browser and does not contain an API credential.
  tawkChat: {
    embedUrl: (typeof import.meta.env?.VITE_TAWK_EMBED_URL === 'string' &&
    import.meta.env.VITE_TAWK_EMBED_URL.trim().length > 0
      ? import.meta.env.VITE_TAWK_EMBED_URL.trim()
      : 'https://embed.tawk.to/6ad07564e735d034c2b19ed6/1k4v4l49a') as `https://embed.tawk.to/${string}/${string}`,
  },
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
