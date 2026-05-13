import { useEffect, useState } from "react";
import { useBookingContext } from "../context";
import type { Business } from "../types";

interface UseBusinessReturn {
  business: Business | null;
  loading: boolean;
  error: string | null;
}

export function useBusiness(): UseBusinessReturn {
  const { state, dispatch, config, apiClient } = useBookingContext();
  const [loading, setLoading] = useState(!state.business);

  useEffect(() => {
    if (state.business) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    apiClient
      .fetchBusiness(config.business)
      .then((biz) => {
        if (cancelled) return;
        dispatch({
          type: "SET_BUSINESS",
          business: {
            ...biz,
            cancellationPolicyEnabled: biz.cancellationPolicyEnabled ?? false,
            cancellationPolicyHours: biz.cancellationPolicyHours ?? null,
            verificationMethod: biz.verificationMethod ?? "SMS",
          },
        });
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Failed to load business",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config.business, apiClient, dispatch, state.business]);

  return {
    business: state.business,
    loading,
    error: state.error,
  };
}
