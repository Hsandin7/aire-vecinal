import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { FooterAttribution } from './components/FooterAttribution';
import { OnboardingModal } from './components/OnboardingModal';
import { useUserProfile } from './hooks/useUserProfile';
import { Home } from './pages/Home';
import { Detail } from './pages/Detail';
import { Alerts } from './pages/Alerts';
import { Profile } from './pages/Profile';

export const App: React.FC = () => {
  const { hasCompletedOnboarding, completeOnboarding } = useUserProfile();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col pb-20 relative">
          {/* Modal de Onboarding si es la primera vez que entra */}
          {!hasCompletedOnboarding && (
            <OnboardingModal
              onComplete={(data) => completeOnboarding(data)}
              onSkip={() => completeOnboarding()}
            />
          )}

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detail" element={<Detail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <FooterAttribution />
          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
