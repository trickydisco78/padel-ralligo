import { useEffect, useState } from 'react';

import { fetchDestinations, type DestinationWithCount } from '@/data/destinations';

export function useDestinations() {
  const [destinations, setDestinations] = useState<DestinationWithCount[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDestinations()
      .then((list) => !cancelled && setDestinations(list))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return { destinations, loading: destinations === null && !failed, failed };
}
