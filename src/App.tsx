import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

import { Login } from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const [isLocked, setIsLocked] = useState(false);
  const { history, recoverMonkMode, theme, syncHabits } = useProtocolStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  // Sync Data on Load
  useEffect(() => {
    if (isAuthenticated) {
      syncHabits();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Login />;

  useEffect(() => {
    // Apply Theme
    document.body.className = ''; // Reset
    if (theme === 'MINIMAL_DARK') document.body.classList.add('minimal-dark');
    if (theme === 'MINIMAL_HOLISTIC') document.body.classList.add('minimal-holistic');

    // Check for Monk Mode triggers
    const today = getProtocolDate();
    const log = history[today];
    if (log?.screenTimeFailed || log?.noGoonFailed) {
      setIsLocked(true);
    }
  }, [history, theme]);

  const handleUnlock = () => {
    recoverMonkMode();
    setIsLocked(false);
  };

  if (isLocked) {
    return <MonkMode isLocked={true} onUnlock={handleUnlock} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-voidblack text-white font-sans antialiased selection:bg-accent-neon/30 selection:text-accent-neon">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<Training />} />
          <Route path="/fuel" element={<Fuel />} />
          <Route path="/vault" element={<Vault />} />
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
