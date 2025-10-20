import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { ApplicationLayout } from '@/layouts/application-layout';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import DivisionPage from './division/division-page';
import UserPage from './user/user-page';
import DashboardPage from './dashboard/dashboard-page';
import EventPage from './event/event-page';
import { PersonalTodoListPage } from './todo-list/personal/personal-todo-list-page';
import { DivisionTodoListPage } from './todo-list/division/division-todo-list-page';
import { ProjectPage } from './project/project-page';
import { TreasuryPage } from './treasury/treasury-page';
import { NotePage } from './note/note-page';
import { NotFoundPage } from './not-found-page';
import { ErrorPage } from './error-page';
import LoginPage from './auth/login-page';
import RegisterPage from './auth/register-page';
import AppearancePage from './settings/appearance';
import ProfilePage from './settings/profile';
import PasswordPage from './settings/password';
import { useEffect } from 'react';

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/divisions" element={<DivisionPage />} />
            <Route path="/event" element={<EventPage />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/treasury" element={<TreasuryPage />} />
            <Route path="/note" element={<NotePage />} />

            {/* Todo List Routes */}
            <Route path="/toDoList/personal" element={<PersonalTodoListPage />} />
            <Route path="/toDoList/division" element={<DivisionTodoListPage />} />

            {/* Settings Routes */}
            <Route path="/settings/appearance" element={<AppearancePage />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="/settings/password" element={<PasswordPage />} />
          </Route>
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;