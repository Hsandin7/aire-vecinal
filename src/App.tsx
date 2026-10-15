import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Detail } from './pages/Detail';
import { Alerts } from './pages/Alerts';
import { Profile } from './pages/Profile';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl flex flex-col pb-20 relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detail" element={<Detail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
