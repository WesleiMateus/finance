import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { BaseLayout } from '../layouts/BaseLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Login } from '../features/auth/Login';
import { SignUp } from '../features/auth/SignUp';
import { Dashboard } from '../features/dashboard/Dashboard';
import { AdminPanel } from '../features/admin/AdminPanel';
import { Onboarding } from '../features/onboarding/Onboarding';
import { TransactionsPage } from '../features/transactions/TransactionsPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/signup',
        element: <SignUp />,
      }
    ]
  },
  {
    element: <BaseLayout />,
    children: [
      {
        element: <ProtectedRoute allowedStatuses={['active', 'pending']} />,
        children: [
          {
            path: '/',
            element: <Dashboard />,
          },
          {
            path: '/onboarding',
            element: <Onboarding />,
          },
          {
            path: '/transactions',
            element: <TransactionsPage />,
          },
          {
            path: '/planning',
            element: <div className="p-4">Planning module coming soon.</div>,
          }
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['admin']} allowedStatuses={['active', 'pending']} />,
        children: [
          {
            path: '/admin',
            element: <AdminPanel />,
          }
        ]
      }
    ]
  },
  {
    path: '/blocked',
    element: <div className="flex h-screen items-center justify-center text-center"><h1 className="text-2xl text-destructive font-bold">Account Blocked</h1></div>
  }
]);
