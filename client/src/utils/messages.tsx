import { ROUTES } from "@common/api/routes";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { apiUrl, assertHttpSuccess, useApiQuery } from "./api";

export type Match =
  | { type: "icon"; key: string; value: string }
  | { type: "text"; key?: string; value: string };

type MessageContextValue = {
  /** Look up the text or icon associated with the given key. Stable. */
  lookup: (key: string, opts?: { def?: string; textOnly?: boolean }) => Match;
  /** Update the "message" context with a different locale. */
  setLocale: (locale: string) => void;
  /** Indicate if something went wrong when fetching the locale or icon bundles. */
  errors: string[];
};

const MessageContext = createContext<MessageContextValue>({
  // Default resolver returns the fallback if it exists, else the key itself, as
  // text.
  lookup: (k, opts) => ({ type: "text", value: opts?.def ?? k, key: k }),
  setLocale: () => {},
  errors: [],
});

/******************************************************************************
 * ### useMessages
 *
 * A hook returning the closest provided "message" context, with handles for
 * setting the current locale and looking up keys used in the locale and/or
 * icon bundles.
 ******************************************************************************/
export function useMessages() {
  return useContext(MessageContext);
}

/******************************************************************************
 * ### MessageProvider
 *
 * Constructs the "message" context and wraps children in context provider.
 ******************************************************************************/
export const MessageProvider = (props: {
  defaultLocale: string;
  children?: React.ReactNode;
}) => {
  const [locale, setLocale] = useState(props.defaultLocale);

  // Query for locale:
  const localeBundle = useApiQuery({
    key: locale,
    fetch: async (signal) => {
      const response = await fetch(
        apiUrl(`${ROUTES.locales.path}/${encodeURIComponent(locale)}`),
        {
          method: "GET",
          signal,
        },
      );
      assertHttpSuccess(response);
      return response;
    },
    parse: async (response) => {
      const json = await response.json();
      return ROUTES.locales.methods.get.schemas.responseBody.parse(json);
    },
  });

  // Query for icons:
  const iconBundle = useApiQuery({
    key: "icons",
    fetch: async (signal) => {
      const response = await fetch(apiUrl(ROUTES.icons.path), {
        method: "GET",
        signal,
      });
      assertHttpSuccess(response);
      return response;
    },
    parse: async (response) => {
      const json = await response.json();
      return ROUTES.icons.methods.get.schemas.responseBody.parse(json);
    },
  });

  const lookup = useCallback(
    (key: string, opts?: { def?: string; textOnly?: boolean }) => {
      const match: Match = (() => {
        if (!opts?.textOnly) {
          const matchingIcon = iconBundle.data?.icons[key];
          if (matchingIcon) return { type: "icon", value: matchingIcon, key };
        }
        const matchingText = localeBundle.data?.bundle[key];
        if (matchingText !== undefined)
          return { type: "text", value: matchingText, key };
        if (opts?.def) return { type: "text", value: opts.def, key };
        return { type: "text", value: key, key };
      })();
      return match;
    },
    [localeBundle.data, iconBundle.data],
  );

  const errors = useMemo(() => {
    const out: string[] = [];
    if (localeBundle.error) out.push(localeBundle.error.message);
    if (iconBundle.error) out.push(iconBundle.error.message);
    return out;
  }, [localeBundle.error, iconBundle.error]);

  const ctx = useMemo(
    () => ({
      lookup,
      setLocale,
      errors,
    }),
    [lookup, errors],
  );

  return (
    <MessageContext.Provider value={ctx}>
      {props.children}
    </MessageContext.Provider>
  );
};
