import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/store/useStore';

export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function RequireFullProfile() {
  const { user } = useAuth();
  const profile = useStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!profile?.skillLevel) {
    return (
      <Navigate
        to="/onboarding/skill-check"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (!profile?.activeCategory) {
    return <Navigate to="/onboarding/pick-category" replace />;
  }
  return <Outlet />;
}
