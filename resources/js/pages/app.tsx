import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Suspense, useEffect } from 'react';

const LoadingSpinner = () => (
  <div className="flex h-dvh items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const router = createBrowserRouter([
  // Public Auth Routes — no layout dependencies
  {
    path: '/login',
    lazy: () => import('./auth/login-page').then(m => ({ Component: m.default })),
  },

  // Protected Application Routes
  {
    lazy: () => import('@/layouts/application-layout').then(m => ({ Component: m.ApplicationLayout })),
    errorElement: <div className="min-h-screen flex items-center justify-center"><p>Something went wrong. <a href="/login" className="underline">Go to login</a></p></div>,
    children: [
      {
        lazy: () => import('@/layouts/dashboard-layout').then(m => ({ Component: m.DashboardLayout })),
        children: [
          { path: '/', lazy: () => import('./dashboard/dashboard-page').then(m => ({ Component: m.default })) },
          { path: '/dashboard', lazy: () => import('./dashboard/dashboard-page').then(m => ({ Component: m.default })) },
          { path: '/users', lazy: () => import('./user/user-page').then(m => ({ Component: m.default })) },
          { path: '/roles', lazy: () => import('./role/role-page').then(m => ({ Component: m.default })) },
          { path: '/divisions', lazy: () => import('./division/division-page').then(m => ({ Component: m.default })) },
          { path: '/event', lazy: () => import('./event/event-page').then(m => ({ Component: m.default })) },
          { path: '/project', lazy: () => import('./project/project-page').then(m => ({ Component: m.ProjectPage })) },
          { path: '/treasury', lazy: () => import('./treasury/treasury-page').then(m => ({ Component: m.TreasuryPage })) },
          { path: '/treasury/request/new', lazy: () => import('./treasury/request/create-request-page').then(m => ({ Component: m.CreateRequestPage })) },
          { path: '/treasury/request/:id/edit', lazy: () => import('./treasury/request/edit-request-page').then(m => ({ Component: m.EditRequestPage })) },
          { path: '/treasury/record/new', lazy: () => import('./treasury/record/create-record-page').then(m => ({ Component: m.CreateRecordPage })) },
          { path: '/treasury/record/:id/edit', lazy: () => import('./treasury/record/edit-record-page').then(m => ({ Component: m.EditRecordPage })) },
          { path: '/note', lazy: () => import('./note/note-page').then(m => ({ Component: m.NotePage })) },
          { path: '/toDoList/personal', lazy: () => import('./todo-list/personal/personal-todo-list-page').then(m => ({ Component: m.PersonalTodoListPage })) },
          { path: '/toDoList/division', lazy: () => import('./todo-list/division/division-todo-list-page').then(m => ({ Component: m.DivisionTodoListPage })) },
          { path: '/settings/appearance', lazy: () => import('./settings/appearance').then(m => ({ Component: m.default })) },
          { path: '/settings/profile', lazy: () => import('./settings/profile').then(m => ({ Component: m.default })) },
          { path: '/settings/password', lazy: () => import('./settings/password').then(m => ({ Component: m.default })) },
          { path: '/settings/google-calendar', lazy: () => import('./settings/google-calendar').then(m => ({ Component: m.default })) },
        ],
      },
    ],
  },

  // Fallback
  {
    path: '*',
    lazy: () => import('./not-found-page').then(m => ({ Component: m.NotFoundPage })),
  },
]);

function App() {
  useEffect(() => {
    const updateViewportWidth = () => {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.documentElement.style.setProperty('--client-viewport-width', `${document.documentElement.clientWidth}px`);
    };
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
