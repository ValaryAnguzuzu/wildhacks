import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { Home } from './screens/Home';
import { Learn } from './screens/Learn';
import { Lesson } from './screens/Lesson';
import { PickCategory } from './screens/PickCategory';
import { Profile } from './screens/Profile';
import { Progress } from './screens/Progress';
import { SkillCheck } from './screens/SkillCheck';
import { Welcome } from './screens/Welcome';

export default function App() {
  return (
    <BrowserRouter>
      <div className="size-full overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/onboarding/skill-check" element={<SkillCheck />} />
          <Route path="/onboarding/pick-category" element={<PickCategory />} />
          <Route path="/home" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/lesson" element={<Lesson />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
