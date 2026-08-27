/* ================================================================== */
/*  Auth React Query Hooks                                             */
/* ================================================================== */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, getMeApi } from '@/services/authApi';
import { setAuthToken, removeAuthToken, getAuthToken } from '@/services/auth';
import { authKeys } from '@/constants/queryKeys';

/* ------------------------------------------------------------------ */
/*  useCurrentUser — fetch authenticated user                          */
/*  Query only fires when a token exists.                              */
/*  On success the user is cached for staleTime.                       */
/*  On 401 the token is already cleared by the apiClient interceptor.  */
/* ------------------------------------------------------------------ */

export function useCurrentUser() {
  const token = getAuthToken();
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    enabled: !!token,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/* ------------------------------------------------------------------ */
/*  useLogin — authenticate, store token, seed user cache              */
/* ------------------------------------------------------------------ */

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

/* ------------------------------------------------------------------ */
/*  useLogout — clear everything and navigate to /login                */
/* ------------------------------------------------------------------ */

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(() => {
    removeAuthToken();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [queryClient, navigate]);
}

/* ------------------------------------------------------------------ */
/*  useAuth — combined auth state for route guards                     */
/*                                                                      */
/*  States:                                                             */
/*    isLoading=true  → checking session (token exists, /auth/me pending) */
/*    isAuthenticated → token + valid user from cache                   */
/*    !isAuthenticated → no token, or /auth/me failed                   */
/* ------------------------------------------------------------------ */

export function useAuth() {
  const { data: user, isLoading, isError } = useCurrentUser();
  const token = getAuthToken();
  const logout = useLogout();

  // isLoading is true only when the query is actively fetching (token present).
  // When there's no token, useCurrentUser is disabled and isLoading is immediately false.
  return {
    user: user ?? null,
    isAuthenticated: !!token && !!user,
    isLoading,
    isError: isError && !!token,
    logout,
  };
}
