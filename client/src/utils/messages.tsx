import { ROUTES } from "@common/api/routes";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { apiUrl, assertHttpSuccess, useApiQuery } from "./api";

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

  const { data, error } = useApiQuery({
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
      error: error?.message ?? null,
    }),
    [resolve, error],
  );

  return (
    <MessageContext.Provider value={ctx}>
      {props.children}
    </MessageContext.Provider>
  );
};
