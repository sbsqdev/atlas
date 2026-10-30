import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ensureSeeded } from '@/data/seed';
import { useMe } from '@/data/api';
import { can, type Permission } from '@/data/rbac';
import { useLocale, useT } from '@/i18n';
import { Spinner } from '@/components/ui';
import AppShell from '@/components/layout/AppShell';
import { Forbidden, NotFound } from '@/pages/Status';
import AuthPage from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';

const AnatomyLab = lazy(() => import('@/features/anatomy/AnatomyLab'));
const SimLibrary = lazy(() => import('@/features/simulations/SimLibrary'));
const SimPlayer = lazy(() => import('@/features/simulations/SimPlayer'));
const Patients = lazy(() => import('@/pages/Patients'));
const PatientPlayer = lazy(() => import('@/pages/PatientPlayer'));
const Catalog = lazy(() => import('@/features/courses/Catalog'));
const CourseDetail = lazy(() => import('@/features/courses/CourseDetail'));
const LessonPlayer = lazy(() => import('@/features/courses/LessonPlayer'));
const Builder = lazy(() => import('@/features/courses/Builder'));
const CourseEditor = lazy(() => import('@/features/courses/CourseEditor'));
const Assessments = lazy(() => import('@/features/assessments/Assessments'));
const TestPlayer = lazy(() => import('@/features/assessments/TestPlayer'));
const Progress = lazy(() => import('@/pages/Progress'));
const Certificates = lazy(() => import('@/pages/Certificates'));
const CertificateView = lazy(() => import('@/pages/CertificateView'));
const Career = lazy(() => import('@/pages/Career'));
const Settings = lazy(() => import('@/pages/Settings'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Classes = lazy(() => import('@/pages/Classes'));
const ClassDetail = lazy(() => import('@/pages/ClassDetail'));
const OrgAdmin = lazy(() => import('@/pages/OrgAdmin'));
const Admin = lazy(() => import('@/pages/Admin'));
const Review = lazy(() => import('@/pages/Review'));
const Landing = lazy(() => import('@/pages/Landing'));
const Activate = lazy(() => import('@/pages/Activate'));
const Issue = lazy(() => import('@/pages/Issue'));
const Legal = lazy(() => import('@/pages/Legal'));
const Community = lazy(() => import('@/pages/Community'));
const Profile = lazy(() => import('@/pages/Profile'));
const Paywall = lazy(() => import('@/features/access/Paywall'));
const Stories = lazy(() => import('@/pages/Stories'));
const Exercises = lazy(() => import('@/pages/Exercises'));
const ConsultPage = lazy(() => import('@/features/consult/Consult'));
const AthleteCard = lazy(() => import('@/pages/AthleteCard'));

function RequireAuth({ children }: { children: ReactNode }) {
  const u = useMe();
  const loc = useLocation();
  // Signed-out visitors see the public course page at the root.
  if (!u) return loc.pathname === '/' ? <Landing /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
/** /atlas without the trailing slash reaches the SPA rewrite; send it to the Human Atlas app at /atlas/. */
function AtlasRedirect() {
  useEffect(() => { if (!location.pathname.endsWith('/')) location.replace(`${location.pathname}/`); }, []);
  return null;
}
function RequirePerm({ p, children }: { p: Permission; children: ReactNode }) {
  const u = useMe();
  return can(u, p) ? <>{children}</> : <Forbidden />;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const { t } = useT();
  const locale = useLocale((s) => s.locale);
  useEffect(() => { ensureSeeded().then(() => setReady(true)); }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  if (!ready) return <Spinner label={t('common.loading')} />;
  return (
    <Suspense fallback={<Spinner label={t('common.loading')} />}>
      <Routes>
        <Route path="/login" element={<AuthPage mode="in" />} />
        <Route path="/register" element={<AuthPage mode="up" />} />
        <Route path="/atlas" element={<AtlasRedirect />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/a/:data" element={<AthleteCard />} />
        <Route path="/issue" element={<Issue />} />
        <Route path="/offer" element={<Legal doc="offer" />} />
        <Route path="/privacy" element={<Legal doc="privacy" />} />
        <Route path="/certificates/:id/print" element={<RequireAuth><CertificateView /></RequireAuth>} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="anatomy" element={<AnatomyLab />} />
          <Route path="community" element={<Community />} />
          <Route path="profile" element={<Profile />} />
          <Route path="access" element={<Paywall />} />
          <Route path="stories" element={<Stories />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="consult" element={<ConsultPage />} />
          <Route path="simulations" element={<SimLibrary />} />
          <Route path="simulations/:id" element={<SimPlayer />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientPlayer />} />
          <Route path="courses" element={<Catalog />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="courses/:id/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/:id" element={<TestPlayer />} />
          <Route path="progress" element={<Progress />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="career" element={<Career />} />
          <Route path="settings" element={<Settings />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="teach/builder" element={<RequirePerm p="course.author"><Builder /></RequirePerm>} />
          <Route path="teach/builder/:id" element={<RequirePerm p="course.author"><CourseEditor /></RequirePerm>} />
          <Route path="teach/classes" element={<RequirePerm p="class.manage"><Classes /></RequirePerm>} />
          <Route path="teach/classes/:id" element={<RequirePerm p="class.manage"><ClassDetail /></RequirePerm>} />
          <Route path="org" element={<RequirePerm p="org.manage"><OrgAdmin /></RequirePerm>} />
          <Route path="admin" element={<RequirePerm p="platform.admin"><Admin /></RequirePerm>} />
          <Route path="admin/review" element={<RequirePerm p="course.review"><Review /></RequirePerm>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
