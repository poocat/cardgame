import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "@server/config";
import { logger } from "@server/logger";
import defaultEn from "./locales/en.json";

type LocaleBundle = Record<string, string>;

const localeMap = new Map<string, LocaleBundle>();

/******************************************************************************
 * ### getLocaleBundle
 *
 * Reads from the locale registry to get the bundle for the given locale key.
 ******************************************************************************/
export function getLocaleBundle(locale: string): LocaleBundle {
  return localeMap.get(locale) ?? {};
}

/******************************************************************************
 * ### registerLocaleBundle
 *
 * Registers a locale bundle under the given key. The bundle is merged over
 * the default English bundle, so any missing keys fall back to defaults.
 ******************************************************************************/
export function registerLocaleBundle(locale: string, bundle: LocaleBundle) {
  localeMap.set(locale, { ...defaultEn, ...bundle });
}

/******************************************************************************
 * ### resetLocaleRegistry
 *
 * Removes all registered locale bundles. Intended for use in tests.
 ******************************************************************************/
export function resetLocaleRegistry() {
  localeMap.clear();
}

/******************************************************************************
 * ### useDefaultLocales
 *
 * Resets the registry and registers the default English bundle.
 ******************************************************************************/
export function useDefaultLocales() {
  resetLocaleRegistry();
  localeMap.set("en", { ...defaultEn });
  logger.info("loaded default locale");
}

/******************************************************************************
 * ### usePrivateLocales
 *
 * Resets the registry and loads locale bundles from the private submodule
 * at `private/theme/locales/`. Each JSON file is registered under its
 * filename (e.g. `en.json` -> locale key `"en"`).
 *
 * The default English bundle is used as the base for every loaded locale,
 * so missing keys fall back to defaults.
 ******************************************************************************/
export function usePrivateLocales() {
  if (!CONFIG.privatePath) {
    throw new Error("No private path configured.");
  }
  const localesDir = path.join(CONFIG.privatePath, "text", "locales");
  const files = fs.readdirSync(localesDir);
  resetLocaleRegistry();
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const locale = file.replace(".json", "");
    const content = fs.readFileSync(path.join(localesDir, file), "utf-8");
    const bundle = JSON.parse(content);
    registerLocaleBundle(locale, bundle);
  }
  logger.info({ count: localeMap.size }, "loaded private locales");
}

/******************************************************************************
 * ### missingBundleKeys
 *
 * Returns any keys from the given `requiredKeys` that are missing from the
 * given locale `bundle`.
 *
 * Used to validate bundles.
 ******************************************************************************/
export function missingBundleKeys(
  bundle: LocaleBundle,
  requiredKeys: readonly string[],
): string[] {
  return requiredKeys.filter((key) => !(key in bundle));
}
