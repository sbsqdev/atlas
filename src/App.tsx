import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import StudentHome from './pages/StudentHome';
import Calculators from './pages/Calculators';
import Achievements from './pages/Achievements';
import CourseView from './pages/CourseView';
import WorkoutView from './pages/WorkoutView';
import ExerciseView from './pages/ExerciseView';
import TrainerDashboard from './pages/TrainerDashboard';
import CourseEditor from './pages/CourseEditor';
import type { ReactNode } from 'react';

function RequireAuth({ children, role }: { children: ReactNode; role?: 'trainer' | 'student' }) {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'trainer' ? '/dashboard' : '/home'} replace />;
  return <>{children}</>;
}

/** Course pages: a student must be enrolled; a coach must own the course. */
function RequireCourseAccess({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const accounts = useAuth((s) => s.accounts);
  const { courseId } = useParams();
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  if (!user) return <Navigate to="/login" replace />;
  if (!course) return <Navigate to={user.role === 'trainer' ? '/dashboard' : '/home'} replace />;
  const owns = user.role === 'trainer' && course.trainerId === user.id;
  const enrolled = accounts.find((a) => a.id === user.id)?.enrolledCourseIds?.includes(course.id);
  if (!owns && !enrolled) return <Navigate to={user.role === 'trainer' ? '/dashboard' : '/home'} replace />;
  return <>{children}</>;
}

function Home() {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'trainer' ? '/dashboard' : '/home'} replace />;
}

const page = (node: ReactNode) => <Layout>{node}</Layout>;

export default function App() {
  const user = useAuth((s) => s.user);

  return (
    <Routes>
      <Route path="/login" element={user ? <Home /> : <Login />} />
      <Route path="/" element={<Home />} />

      <Route path="/home" element={<RequireAuth role="student">{page(<StudentHome />)}</RequireAuth>} />
      <Route path="/achievements" element={<RequireAuth role="student">{page(<Achievements />)}</RequireAuth>} />
      <Route path="/calculators" element={<RequireAuth>{page(<Calculators />)}</RequireAuth>} />

      <Route path="/course/:courseId" element={<RequireCourseAccess>{page(<CourseView />)}</RequireCourseAccess>} />
      <Route path="/course/:courseId/workout/:workoutId" element={<RequireCourseAccess>{page(<WorkoutView />)}</RequireCourseAccess>} />
      <Route path="/course/:courseId/workout/:workoutId/exercise/:exerciseId" element={<RequireCourseAccess>{page(<ExerciseView />)}</RequireCourseAccess>} />

      <Route path="/dashboard" element={<RequireAuth role="trainer">{page(<TrainerDashboard />)}</RequireAuth>} />
      <Route path="/dashboard/course/:courseId" element={<RequireAuth role="trainer">{page(<CourseEditor />)}</RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
