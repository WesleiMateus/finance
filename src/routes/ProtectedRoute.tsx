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
    return <Navigate to="/" replace />; // Or to a restricted page
  }

  if (!allowedStatuses.includes(user.status)) {
    if (user.status === 'blocked') {
      return <Navigate to="/blocked" replace />;
    }
  }

  // Redirect to onboarding if not completed and trying to access main routes
  if (user.role === 'user' && !user.onboardingCompleted && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // If status is pending but they try to access non-dashboard routes, handle it in components or restrict routes here
  // According to rules: pending can log in, view financial data, see payment dialog, but CUD ops are blocked. 

  return <Outlet />;
};
