import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Runs `refetch` each time the screen regains focus (coming back from another screen or a sheet), but not
 * on first focus, when the query is already loading. There are no live updates, so this is how a request
 * decided elsewhere shows up.
 */
export function useRefetchOnFocus(refetch: () => unknown) {
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
