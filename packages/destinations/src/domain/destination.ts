export type Destination = {
  id: string;
  name: string;
  country: string;
  tagline: string;
};

/** A destination together with how many open games are currently listed there. */
export type DestinationWithCount = Destination & { openListings: number };
