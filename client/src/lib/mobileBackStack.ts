/** Touch / coarse-pointer devices where OS back should dismiss overlays first. */
export function isTouchLikeDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches
  );
}

type Layer = {
  id: string;
  onClose: () => void;
};

const HISTORY_KEY = 'hrBack';

let layers: Layer[] = [];
let listenerInstalled = false;
let suppressPop = false;

function installPopstateListener() {
  if (listenerInstalled) return;
  listenerInstalled = true;
  window.addEventListener('popstate', () => {
    if (suppressPop) {
      suppressPop = false;
      return;
    }
    const top = layers[layers.length - 1];
    if (!top) return;
    layers.pop();
    top.onClose();
  });
}

/**
 * Push a history entry so the next back gesture closes this layer instead of leaving the app.
 * Returns an unregister function (runs on unmount or when the layer is dismissed).
 */
export function pushMobileBackLayer(id: string, onClose: () => void): () => void {
  if (!isTouchLikeDevice()) return () => {};

  installPopstateListener();
  layers.push({ id, onClose });
  window.history.pushState({ [HISTORY_KEY]: id }, '');

  return () => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const wasTop = idx === layers.length - 1;
    layers.splice(idx, 1);
    if (wasTop && window.history.state?.[HISTORY_KEY] === id) {
      suppressPop = true;
      window.history.back();
    }
  };
}
