import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type {
  OpeningsConfig,
  OpeningsCallbacks,
  BookingEntry,
  Step,
} from "./types";
import {
  bookingReducer,
  initialState,
  type BookingState,
  type BookingAction,
} from "./reducer";
import { createApiClient, type ApiClient } from "./api";

/* ─── Context shape ─── */

interface BookingContextValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  config: OpeningsConfig & {
    apiBase: string;
    locale: string;
    currency: string;
    timezone: string;
  };
  apiClient: ApiClient;
  callbacks: OpeningsCallbacks;
}

const BookingContext = createContext<BookingContextValue | null>(null);

/* ─── Hook to read context ─── */

export function useBookingContext(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error(
      "useBookingContext must be used within an <OpeningsProvider>",
    );
  }
  return ctx;
}

/* ─── Provider ─── */

const DEFAULT_API_BASE = "https://api.openings.link";

interface OpeningsProviderProps {
  /** Business handle (slug). Required. */
  business: string;
  /** API base URL. Defaults to production. */
  apiBase?: string;
  /** Locale for formatting. */
  locale?: string;
  /** Currency code. */
  currency?: string;
  /** Timezone override. */
  timezone?: string;
  /** Entry point — pre-select schedule and/or member. */
  entry?: BookingEntry;
  /** Custom API client (for testing or custom auth). */
  apiClient?: ApiClient;
  /** Event callbacks. */
  on?: OpeningsCallbacks;
  children: ReactNode;
}

export function OpeningsProvider({
  business,
  apiBase = DEFAULT_API_BASE,
  locale = "en-US",
  currency = "USD",
  timezone = "auto",
  entry,
  apiClient: customApiClient,
  on = {},
  children,
}: OpeningsProviderProps) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const config = useMemo(
    () => ({
      business,
      apiBase,
      locale,
      currency,
      timezone,
      entry: entry ?? { scheduleId: undefined, memberId: undefined },
    }),
    [business, apiBase, locale, currency, timezone, entry],
  );

  // Set entry props into state on mount
  useEffect(() => {
    if (entry?.scheduleId || entry?.memberId) {
      dispatch({
        type: "SET_ENTRY",
        scheduleId: entry.scheduleId ?? null,
        memberId: entry.memberId ?? null,
      });
    }
  }, [entry?.scheduleId, entry?.memberId]);

  const apiClient = useMemo(
    () => customApiClient ?? createApiClient(apiBase),
    [customApiClient, apiBase],
  );

  // Fire step change callback
  const prevStepRef = useMemo(() => ({ current: state.step }), []);
  useEffect(() => {
    if (prevStepRef.current !== state.step) {
      on.onStepChange?.(prevStepRef.current as Step, state.step);
      prevStepRef.current = state.step;
    }
  }, [state.step, on, prevStepRef]);

  const value = useMemo(
    () => ({ state, dispatch, config, apiClient, callbacks: on }),
    [state, dispatch, config, apiClient, on],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}
