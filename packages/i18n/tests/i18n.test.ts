import { buildResources, createI18n, translateFieldErrors } from "../src";

const locales = {
  auth: { en: { hello: "Hello {{name}}", items_one: "{{count}} item", items_other: "{{count}} items" }, es: { hello: "Hola {{name}}" } },
  ui: { en: { close: "Close" } },
};

describe("buildResources", () => {
  it("groups copy by language then namespace", () => {
    const resources = buildResources(locales);
    expect(Object.keys(resources).sort()).toEqual(["en", "es"]);
    expect(Object.keys(resources.en!).sort()).toEqual(["auth", "ui"]);
  });
});

describe("createI18n", () => {
  const resources = buildResources(locales);

  it("translates with namespaces, placeholders and plurals", () => {
    const i18n = createI18n({ resources });
    expect(i18n.t("auth:hello", { name: "Sam" })).toBe("Hello Sam");
    expect(i18n.t("auth:items", { count: 1 })).toBe("1 item");
    expect(i18n.t("auth:items", { count: 0 })).toBe("0 items");
    expect(i18n.t("ui:close")).toBe("Close");
  });

  it("uses the requested language when it has copy, with English fallback per key", () => {
    const i18n = createI18n({ resources, language: "es" });
    expect(i18n.t("auth:hello", { name: "Sam" })).toBe("Hola Sam");
    expect(i18n.t("ui:close")).toBe("Close");
  });

  it("falls back to English for an unsupported language", () => {
    expect(createI18n({ resources, language: "fr" }).language).toBe("en");
  });
});

describe("translateFieldErrors", () => {
  it("translates each field's key with shared params", () => {
    const i18n = createI18n({ resources: buildResources({ auth: { en: { too_short: "At least {{min}}", required: "Required" } } }) });
    const t = i18n.getFixedT(null, "auth");
    expect(translateFieldErrors(t, { a: "too_short", b: "required" }, { min: 8 })).toEqual({ a: "At least 8", b: "Required" });
  });
});
