/**
 * Architecture boundary rules, enforced as errors. See docs/architecture.md and
 * openspec/changes/monorepo-domain-architecture.
 *
 * Flat-config globs resolve relative to the package being linted, so the layer
 * rules apply inside any domain package that uses `src/{domain,application,
 * infrastructure,presentation}`. Because a later `no-restricted-imports` block
 * replaces an earlier one for the same files, each block repeats the shared
 * deep-import ban.
 */

const SEVERITY = "error";

const DEEP_IMPORT = {
  group: ["@padel/*/src", "@padel/*/src/**", "@padel/*/*/src/**"],
  message:
    "Import from the package entry point (e.g. '@padel/destinations'), not its internals.",
};

const DOMAIN_PACKAGES = [
  "@padel/auth",
  "@padel/destinations",
  "@padel/listings",
  "@padel/bookings",
  "@padel/profiles",
  "@padel/players",
];

const layer = (name) => ({
  group: [`**/${name}`, `**/${name}/**`],
  message: `This layer must not import from the '${name}' layer.`,
});

const rule = (...patterns) => [
  SEVERITY,
  { patterns: [DEEP_IMPORT, ...patterns] },
];

/** Applies to every package: no deep imports into other workspace packages. */
export const boundaries = [
  {
    rules: { "no-restricted-imports": rule() },
  },
  // Inside a domain package: domain <- application <- presentation;
  // infrastructure depends on domain only; presentation never imports infrastructure.
  {
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": rule(
        layer("application"),
        layer("infrastructure"),
        layer("presentation"),
      ),
    },
  },
  {
    files: ["src/application/**"],
    rules: {
      "no-restricted-imports": rule(layer("infrastructure"), layer("presentation")),
    },
  },
  {
    files: ["src/infrastructure/**"],
    rules: {
      "no-restricted-imports": rule(layer("application"), layer("presentation")),
    },
  },
  {
    files: ["src/presentation/**"],
    rules: { "no-restricted-imports": rule(layer("infrastructure")) },
  },
];

/** For `@padel/ui`: the design system must not depend on any domain package. */
export const uiBoundaries = [
  {
    files: ["src/**"],
    rules: {
      "no-restricted-imports": rule({
        group: DOMAIN_PACKAGES.flatMap((p) => [p, `${p}/**`]),
        message: "@padel/ui must not depend on domain packages.",
      }),
    },
  },
];
