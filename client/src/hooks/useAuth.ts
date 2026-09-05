/* ================================================================== */
/*  Auth React Query Hooks                                             */
/* ================================================================== */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, getMeApi, logoutApi } from '@/services/authApi';
import { authKeys } from '@/constants/queryKeys';

/* ------------------------------------------------------------------ */
/*  useCurrentUser — fetch authenticated user                          */
/*  Always fetches /auth/me since token is in httpOnly cookie          */
/* ------------------------------------------------------------------ */

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/* ------------------------------------------------------------------ */
/*  useLogin — authenticate, seed user cache                           */
/* ------------------------------------------------------------------ */

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (data) => {
      // Token is set via httpOnly cookie by server
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

/* ------------------------------------------------------------------ */
/*  useLogout — call logout API, clear cache, navigate to /login      */
/* ------------------------------------------------------------------ */

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout API errors
    }
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [queryClient, navigate]);
}

/* ------------------------------------------------------------------ */
/*  useAuth — combined auth state for route guards                     */
/*                                                                      */
/*  States:                                                             */
/*    isLoading=true  → checking session (/auth/me pending)            */
/*    isAuthenticated → valid user from cache                          */
/*    !isAuthenticated → /auth/me failed                               */
/* ------------------------------------------------------------------ */

export function useAuth() {
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    isError,
    logout,
  };
}
