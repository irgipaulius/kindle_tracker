import React from 'react';

import { pushMobileBackLayer } from '../lib/mobileBackStack';

/**
 * On touch devices, register a history entry while `active` so back / iOS edge-swipe
 * calls `onClose` instead of leaving the SPA.
 */
export function useMobileBackClose(active: boolean, onClose: () => void, layerId: string) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!active) return;
    return pushMobileBackLayer(layerId, () => onCloseRef.current());
  }, [active, layerId]);
}
