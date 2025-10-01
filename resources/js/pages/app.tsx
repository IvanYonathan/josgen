import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { ApplicationLayout } from '@/layouts/application-layout';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import DivisionPage from './division/division-page';
import DashboardPage from './dashboard/dashboard-page';
import EventPage from './event/event-page';
import { PersonalTodoListPage } from './todo-list/personal/personal-todo-list-page';
import { DivisionTodoListPage } from './todo-list/division/division-todo-list-page';
import { ProjectPage } from './project/project-page';
import { TreasuryPage } from './treasury/treasury-page';
import { NotePage } from './note/note-page';
import { NotFoundPage } from './not-found-page';
import { ErrorPage } from './error-page';
import ReactLoginPage from './auth/react-login-page';
import ReactRegisterPage from './auth/react-register-page';
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
        <Route path="/login" element={<ReactLoginPage />} />
        <Route path="/register" element={<ReactRegisterPage />} />

        {/* Protected Application Routes */}
        <Route element={<ApplicationLayout />} errorElement={<ErrorPage />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" index element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/divisions" element={<DivisionPage />} />
            <Route path="/event" element={<EventPage />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/treasury" element={<TreasuryPage />} />
            <Route path="/note" element={<NotePage />} />

            {/* Todo List Routes */}
            <Route path="/toDoList/personal" element={<PersonalTodoListPage />} />
            <Route path="/toDoList/division" element={<DivisionTodoListPage />} />
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