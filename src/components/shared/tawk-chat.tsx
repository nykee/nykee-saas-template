import { useEffect } from 'react';

/**
 * Public widget addresses identify a tawk.to property and its chat widget.
 * They are browser configuration, never a server-side API key.
 */
type TawkChatProps = {
  embedUrl?: `https://embed.tawk.to/${string}/${string}` | string | null;
};

/**
 * The bootstrap initializes the globals required by tawk.to's official
 * embed code; visitor identity and authenticated API calls are not configured.
 */
declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

const scriptId = 'tawk-chat-widget-script';

/**
 * Mount once in the shared root layout so public pages and application routes
 * keep the same conversation while navigating through the client-side router.
 */
export function TawkChat({ embedUrl }: TawkChatProps) {
  useEffect(() => {
    if (!embedUrl) {
      return;
    }

    // Initialize after hydration: tawk.to owns its injected iframe and must
    // not change the server-rendered document while React is hydrating it.
    // The stable script ID also makes repeated React effect setup idempotent.
    if (document.getElementById(scriptId)) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Use the official asynchronous embed protocol without blocking page
    // rendering or adding an SDK dependency to the application's bundle.
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = embedUrl;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);

    // This is a document-lifetime integration. Removing its script on effect
    // cleanup would leave tawk.to's live iframe behind and allow a second
    // initialization on remount; the browser releases it on full navigation.
  }, [embedUrl]);

  return null;
}
