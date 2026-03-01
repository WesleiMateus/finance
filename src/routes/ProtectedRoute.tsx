import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { Role, AccountStatus } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  allowedStatuses?: AccountStatus[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles,
  allowedStatuses = ['active', 'pending'] // By default, blocked users can't access
}) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Access denied to ${window.location.pathname}. user.role: ${user.role}, required: ${allowedRoles.join(',')}`);
    return <Navigate to="/" replace />;
  }

  if (!allowedStatuses.includes(user.status)) {
    if (user.status === 'blocked') {
      return <Navigate to="/blocked" replace />;
    }
  }

  // Redirect to onboarding if not completed and trying to access main routes
  if ((user.role === 'user' || user.role === 'admin' || user.role === 'owner') && !user.onboardingCompleted && window.location.pathname !== '/onboarding' && window.location.pathname !== '/login') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};
