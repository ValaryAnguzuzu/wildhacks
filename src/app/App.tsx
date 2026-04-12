import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CelebrationManager } from '@/components/CelebrationManager';
import { OfflineBanner } from '@/components/OfflineBanner';
import { RequireAuth, RequireFullProfile } from '@/components/ProtectedRoute';
import { useDebouncedUserSync } from '@/hooks/useDebouncedUserSync';

const Welcome = lazy(async () => {
  const m = await import('./screens/Welcome');
  return { default: m.Welcome };
});
const Login = lazy(async () => {
  const m = await import('./screens/Login');
  return { default: m.Login };
});
const SkillCheck = lazy(async () => {
  const m = await import('./screens/SkillCheck');
  return { default: m.SkillCheck };
});
const PickCategory = lazy(async () => {
  const m = await import('./screens/PickCategory');
  return { default: m.PickCategory };
});
const Home = lazy(async () => {
  const m = await import('./screens/Home');
  return { default: m.Home };
});
const Learn = lazy(async () => {
  const m = await import('./screens/Learn');
  return { default: m.Learn };
});
const Lesson = lazy(async () => {
  const m = await import('./screens/Lesson');
  return { default: m.Lesson };
});
const Progress = lazy(async () => {
  const m = await import('./screens/Progress');
  return { default: m.Progress };
});
const Profile = lazy(async () => {
  const m = await import('./screens/Profile');
  return { default: m.Profile };
});
const Result = lazy(async () => {
  const m = await import('./screens/Result');
  return { default: m.Result };
});
const Report = lazy(async () => {
  const m = await import('./screens/Report');
  return { default: m.Report };
});
const Squad = lazy(async () => {
  const m = await import('./screens/Squad');
  return { default: m.Squad };
});
const SquadCreate = lazy(async () => {
  const m = await import('./screens/SquadCreate');
  return { default: m.SquadCreate };
});
const SquadJoin = lazy(async () => {
  const m = await import('./screens/SquadJoin');
  return { default: m.SquadJoin };
});

function RouteFallback() {
  return (
    <div className="min-h-screen p-6 space-y-4 bg-[var(--background)]">
      <div className="h-10 w-40 rounded-lg bg-teal-500/10 animate-pulse" />
      <div className="h-32 w-full max-w-md rounded-[var(--radius-card)] bg-teal-500/10 animate-pulse mx-auto" />
    </div>
  );
}

function AppRoutes() {
  useDebouncedUserSync();

  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Welcome />} />
          <Route element={<RequireAuth />}>
            <Route path="/onboarding/skill-check" element={<SkillCheck />} />
            <Route path="/onboarding/pick-category" element={<PickCategory />} />
          </Route>
          <Route element={<RequireFullProfile />}>
            <Route path="/home" element={<Home />} />
            <Route path="/learn/:categoryId?" element={<Learn />} />
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/result" element={<Result />} />
            <Route path="/report" element={<Report />} />
            <Route path="/squad" element={<Squad />} />
            <Route path="/squad/create" element={<SquadCreate />} />
            <Route path="/squad/join" element={<SquadJoin />} />
          </Route>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
      <CelebrationManager />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="size-full min-h-screen overflow-auto">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
