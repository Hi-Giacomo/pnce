import { createBrowserRouter, type RouteObject } from 'react-router';
import Welcome from '../pages/welcome';
import Login from '../pages/login';
import Manager from '../pages/manager';
import Dashboard from '../pages/manager/pages/Dashboard';
import Services from '../pages/manager/pages/Services';
import Apis from '../pages/manager/pages/Apis';
import Users from '../pages/manager/pages/Users';
import Settings from '../pages/manager/pages/Settings';
import { ProtectedRoute } from './ProtectedRoute';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Welcome />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/manager',
    element: (
      <ProtectedRoute>
        <Manager />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services',
        element: (
          <ProtectedRoute>
            <Services />
          </ProtectedRoute>
        ),
      },
      {
        path: 'apis',
        element: (
          <ProtectedRoute>
            <Apis />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
    ],
  },
];

createBrowserRouter(routes);
