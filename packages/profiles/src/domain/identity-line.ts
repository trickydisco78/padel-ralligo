type Parts = { tier?: string | null; city?: string | null };

/** The muted line under the name: skill tier and home city, joined with a middle dot, skipping what is missing. */
export function identityLine({ tier, city }: Parts): string {
  return [tier, city]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(' · ');
}
