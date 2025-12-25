import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUser, clearAuth, AuthUser } from '@/lib/storage';

export function useAuth(requireAuth: boolean = true) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authUser = getAuthUser();
    setUser(authUser);
    setIsLoading(false);

    if (requireAuth && !authUser) {
      navigate('/auth');
    }
  }, [navigate, requireAuth]);

  const logout = () => {
    clearAuth();
    setUser(null);
    navigate('/');
  };

  return { user, isLoading, logout };
}
