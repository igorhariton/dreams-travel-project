import { useCallback, useState } from 'react';

export const useMapController = () => {
  const [focusedPlaceId, setFocusedPlaceId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  const focusPlace = useCallback((placeId: string) => {
    setFocusedPlaceId(placeId);
    setFocusNonce((prev) => prev + 1);
  }, []);

  return {
    focusedPlaceId,
    focusNonce,
    focusPlace,
  };
};
