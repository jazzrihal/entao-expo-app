import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptTerms,
  getCurrentTerms,
  hasAcceptedCurrentTerms,
} from "@/lib/terms";
import { assertOk } from "@/lib/result";
import { queryKeys } from "@/queries/keys";

export function useCurrentTermsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.terms.current(),
    queryFn: async () => assertOk(await getCurrentTerms()),
    enabled: options?.enabled ?? true,
  });
}

export function useHasAcceptedCurrentTermsQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.terms.accepted(),
    queryFn: async () => {
      const result = await hasAcceptedCurrentTerms();
      if (result.error) throw new Error(result.error);
      return result.data === true;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAcceptTermsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, hash }: { slug: string; hash: string }) =>
      assertOk(await acceptTerms(slug, hash)),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.terms.accepted(), true);
      queryClient.invalidateQueries({ queryKey: queryKeys.terms.accepted() });
    },
  });
}
