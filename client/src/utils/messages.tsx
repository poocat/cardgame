import { ROUTES } from "@common/api/routes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { z } from "zod";

const bundleSchema = ROUTES.locales.methods.get.schemas.responseBody;
type LocaleBundle = z.infer<typeof bundleSchema>;

type MessageContextValue = {
  /** Replace with text matching the given key. */
  resolve: (key: string, def?: string) => string;
  /** Update the "message" context with a different locale. */
  setLocale: (locale: string) => void;
  /** Indicates if something went wrong when fetching the locale bundle. */
  error: string | null;
};

const MessageContext = createContext<MessageContextValue>({
  // Default resolver returns the fallback if it exists, else the key itself.
  resolve: (k, d) => d ?? k,
  setLocale: () => {},
  error: null,
});

/******************************************************************************
 * ### useMessages
 *
 * A hook returning the closest provided "message" context, with handles for
 * setting the current locale and resolving messages.
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
  const [data, setData] = useState<LocaleBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const response = await fetch(`${ROUTES.locales.path}/${locale}`, {
          method: "GET",
        });
        if (cancelled) return;
        if (response.ok) {
          const j = await response.json();
          if (cancelled) return;
          const d = ROUTES.locales.methods.get.schemas.responseBody.parse(j);
          setData(d);
        } else {
          setError(`Could not fetch locale: ${response.statusText}`);
        }
      } catch (error) {
        setError(`Error: ${error}`);
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const resolve = useCallback(
    (key: string, def?: string) => {
      return data?.bundle[key] ?? def ?? key;
    },
    [data],
  );

  const ctx = useMemo(
    () => ({
      resolve,
      setLocale,
      error,
    }),
    [resolve, error],
  );

  return (
    <MessageContext.Provider value={ctx}>
      {props.children}
    </MessageContext.Provider>
  );
};
