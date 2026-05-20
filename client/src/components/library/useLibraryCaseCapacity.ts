import React from 'react';

export function useLibraryCaseCapacity(): number {
  const [capacity, setCapacity] = React.useState(10);

  React.useEffect(() => {
    const md = window.matchMedia('(min-width: 768px)');
    const lg = window.matchMedia('(min-width: 1024px)');

    function update() {
      if (lg.matches) setCapacity(12);
      else if (md.matches) setCapacity(10);
      else setCapacity(8);
    }

    update();
    md.addEventListener('change', update);
    lg.addEventListener('change', update);
    return () => {
      md.removeEventListener('change', update);
      lg.removeEventListener('change', update);
    };
  }, []);

  return capacity;
}

/** True on phones, tablets, and Chrome device emulation (hover: none). */
export function useTouchLikeUI(): boolean {
  const [touchLike, setTouchLike] = React.useState(false);

  React.useEffect(() => {
    const hoverNone = window.matchMedia('(hover: none)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () => setTouchLike(hoverNone.matches || coarse.matches);
    update();
    hoverNone.addEventListener('change', update);
    coarse.addEventListener('change', update);
    return () => {
      hoverNone.removeEventListener('change', update);
      coarse.removeEventListener('change', update);
    };
  }, []);

  return touchLike;
}

/** @deprecated Use useTouchLikeUI */
export function useCoarsePointer(): boolean {
  return useTouchLikeUI();
}
