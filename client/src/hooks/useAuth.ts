import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Log auth status for debugging
  if (error) {
    console.log('Auth error:', error);
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
