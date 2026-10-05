import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Trainers from './pages/Trainers';
import CourseView from './pages/CourseView';
import WorkoutView from './pages/WorkoutView';
import ExerciseView from './pages/ExerciseView';
import TrainerDashboard from './pages/TrainerDashboard';
import CourseEditor from './pages/CourseEditor';
import type { ReactNode } from 'react';

function RequireAuth({ children, trainer }: { children: ReactNode; trainer?: boolean }) {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (trainer && user.role !== 'trainer') return <Navigate to="/trainers" replace />;
  return <>{children}</>;
}

export default function App() {
  const user = useAuth((s) => s.user);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/trainers" replace /> : <Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout>
              <Navigate to="/trainers" replace />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/trainers"
        element={
          <RequireAuth>
            <Layout>
              <Trainers />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/course/:courseId"
        element={
          <RequireAuth>
            <Layout>
              <CourseView />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/course/:courseId/workout/:workoutId"
        element={
          <RequireAuth>
            <Layout>
              <WorkoutView />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/course/:courseId/workout/:workoutId/exercise/:exerciseId"
        element={
          <RequireAuth>
            <Layout>
              <ExerciseView />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth trainer>
            <Layout>
              <TrainerDashboard />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/course/:courseId"
        element={
          <RequireAuth trainer>
            <Layout>
              <CourseEditor />
            </Layout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
