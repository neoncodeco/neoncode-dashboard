"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAppAuth from "@/hooks/useAppAuth";
import { apiGet, apiMutate } from "@/lib/apiClient";

const DEFAULT_STALE_TIME = 60_000;
const DEFAULT_GC_TIME = 5 * 60_000;

export function useApiQuery(queryKey, path, options = {}) {
  const { token } = useAppAuth();
  const {
    enabled = true,
    staleTime = DEFAULT_STALE_TIME,
    gcTime = DEFAULT_GC_TIME,
    select,
    ...rest
  } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: ({ signal }) => apiGet(path, token, { signal }),
    enabled: Boolean(token) && enabled,
    staleTime,
    gcTime,
    select,
    ...rest,
  });
}

export function useApiMutation(mutationFn, options = {}) {
  const { token } = useAppAuth();
  const queryClient = useQueryClient();
  const { invalidateKeys = [], onSuccess, ...rest } = options;

  return useMutation({
    mutationFn: (variables) => mutationFn(variables, token),
    onSuccess: async (data, variables, context) => {
      for (const key of invalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      await onSuccess?.(data, variables, context);
    },
    ...rest,
  });
}

export function useInvalidateApi() {
  const queryClient = useQueryClient();
  return (queryKey) => queryClient.invalidateQueries({ queryKey });
}

export function useApiQueryClient() {
  return useQueryClient();
}

export { apiGet, apiMutate };
