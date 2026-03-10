import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ApplicationLayout } from '@/layouts/application-layout';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { NotFoundPage } from './not-found-page';
import { ErrorPage } from './error-page';
import { lazy, Suspense, useEffect } from 'react';

// Lazy-loaded pages — only downloaded when the route is visited
const LoginPage = lazy(() => import('./auth/login-page'));
const RegisterPage = lazy(() => import('./auth/register-page'));
const DashboardPage = lazy(() => import('./dashboard/dashboard-page'));
const DivisionPage = lazy(() => import('./division/division-page'));
const UserPage = lazy(() => import('./user/user-page'));
const RolePage = lazy(() => import('./role/role-page'));
const EventPage = lazy(() => import('./event/event-page'));
const PersonalTodoListPage = lazy(() => import('./todo-list/personal/personal-todo-list-page').then(m => ({ default: m.PersonalTodoListPage })));
const DivisionTodoListPage = lazy(() => import('./todo-list/division/division-todo-list-page').then(m => ({ default: m.DivisionTodoListPage })));
const ProjectPage = lazy(() => import('./project/project-page').then(m => ({ default: m.ProjectPage })));
const TreasuryPage = lazy(() => import('./treasury/treasury-page').then(m => ({ default: m.TreasuryPage })));
const CreateRequestPage = lazy(() => import('./treasury/request/create-request-page').then(m => ({ default: m.CreateRequestPage })));
const EditRequestPage = lazy(() => import('./treasury/request/edit-request-page').then(m => ({ default: m.EditRequestPage })));
const CreateRecordPage = lazy(() => import('./treasury/record/create-record-page').then(m => ({ default: m.CreateRecordPage })));
const EditRecordPage = lazy(() => import('./treasury/record/edit-record-page').then(m => ({ default: m.EditRecordPage })));
const NotePage = lazy(() => import('./note/note-page').then(m => ({ default: m.NotePage })));
const AppearancePage = lazy(() => import('./settings/appearance'));
const ProfilePage = lazy(() => import('./settings/profile'));
const PasswordPage = lazy(() => import('./settings/password'));
const GoogleCalendarPage = lazy(() => import('./settings/google-calendar'));

function App() {
  useEffect(() => {
    const updateViewportWidth = () => {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.documentElement.style.setProperty('--client-viewport-width', `${document.documentElement.clientWidth}px`);
    };
    updateViewportWidth();

    window.addEventListener('resize', updateViewportWidth);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route element={<ApplicationLayout />} errorElement={<ErrorPage />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" index element={<DashboardPage />} />
            <Route path='/users' element={<UserPage />} />
            <Route path="/roles" element={<RolePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/divisions" element={<DivisionPage />} />
            <Route path="/event" element={<EventPage />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/treasury" element={<TreasuryPage />} />
            <Route path="/treasury/request/new" element={<CreateRequestPage />} />
            <Route path="/treasury/request/:id/edit" element={<EditRequestPage />} />
            <Route path="/treasury/record/new" element={<CreateRecordPage />} />
            <Route path="/treasury/record/:id/edit" element={<EditRecordPage />} />
            <Route path="/note" element={<NotePage />} />

            {/* Todo List Routes */}
            <Route path="/toDoList/personal" element={<PersonalTodoListPage />} />
            <Route path="/toDoList/division" element={<DivisionTodoListPage />} />

            {/* Settings Routes */}
            <Route path="/settings/appearance" element={<AppearancePage />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="/settings/password" element={<PasswordPage />} />
            <Route path="/settings/google-calendar" element={<GoogleCalendarPage />} />
          </Route>
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </>
    )
  );

  return (
    <>
      <Suspense fallback={<div className="flex h-dvh items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;

