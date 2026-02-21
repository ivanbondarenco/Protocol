import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useProtocolStore } from './store/useProtocolStore';
import { getProtocolDate } from './lib/dateUtils';
import { Dashboard } from './pages/Dashboard';
import { Training } from './pages/Training';
import { Fuel } from './pages/Fuel';
import { Vault } from './pages/Vault';
import { Pomodoro } from './pages/Pomodoro';
import { MonkMode } from './pages/MonkMode';
import { HabitGrid } from './pages/HabitGrid';
import { BottomNav } from './components/BottomNav';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { closeRealtimeSocket, getRealtimeSocket } from './services/realtimeService';
import { Social } from './pages/Social';

import { Login } from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { history, recoverMonkMode, theme, syncHabits, checkDailyReset, onboardingByUserId } = useProtocolStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  const user = useAuthStore(state => state.user);

  // Check Logical Day Reset
  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  // Derived State for Monk Mode Lock
  const today = getProtocolDate();
  const log = history[today];
  const isLocked = Boolean(log?.screenTimeFailed || log?.noGoonFailed);

  // Sync Data on Load
  useEffect(() => {
    if (isAuthenticated) {
      syncHabits();
      getRealtimeSocket();
    } else {
      closeRealtimeSocket();
    }
  }, [isAuthenticated, syncHabits]);

  useEffect(() => {
    // Apply Theme
    document.body.className = ''; // Reset
    if (theme === 'MINIMAL_HOLISTIC') {
      document.body.classList.add('minimal-holistic');
      return;
    }
    if (theme === 'MINIMAL_LIGHT') {
      document.body.classList.add('minimal-light');
      return;
    }
    document.body.classList.add('minimal-dark');
  }, [theme]);

  if (!isAuthenticated) return <Login />;
  const hasCompletedOnboarding = !!(user?.id && (onboardingByUserId[user.id] || user.onboardingCompleted));
  if (!hasCompletedOnboarding) return <OnboardingFlow />;

  const handleUnlock = () => {
    recoverMonkMode();
    // No need to set local state, store update will trigger re-render
  };

  if (isLocked) {
    return <MonkMode isLocked={true} onUnlock={handleUnlock} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-voidblack text-white font-sans antialiased">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<Training />} />
          <Route path="/fuel" element={<Fuel />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/social" element={<Social />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/monk-mode" element={<MonkMode />} />
          <Route path="/grid" element={<HabitGrid />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
