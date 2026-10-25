import { useEffect, useRef } from 'react';

import { trackEvent } from '../utils/analytics';
import { reportPushOpened } from '../utils/webPush';

/**
 * Call once from any screen a notification can open. The backend stamps each
 * notification's link with utm_source=push and a utm_campaign naming its kind;
 * seeing that on arrival is the only click signal a service worker can hand to
 * the page. Counted once per mount, and also resets the "ignored" streak that
 * would otherwise switch the topic off.
 */
const usePushOpened = () => {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('utm_source') !== 'push') return;
    handled.current = true;
    const campaign = params.get('utm_campaign') || 'unknown';
    trackEvent('push_notification_opened', { trigger: campaign });
    void reportPushOpened(campaign);
  }, []);
};

export default usePushOpened;
