import { useProtocolStore } from '../store/useProtocolStore';
import { useAuthStore } from '../store/useAuthStore';
import { GlitchText } from '../components/GlitchText';
import { ProtocolToggle } from '../components/ProtocolToggle';
import { ProgressBar } from '../components/ProgressBar';
import { NeonCard } from '../components/NeonCard';
import { getProtocolDate, getDisplayDate } from '../lib/dateUtils';
import { subDays, format, addDays, isAfter } from 'date-fns';
import { useMemo, useState } from 'react';
import { Plus, X, AlertOctagon, Settings, Palette, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_TRANSLATIONS } from '../data/translations';

// Matrix Component
const MatrixGrid = () => {
    const { history } = useProtocolStore();
    const matrixDays = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => {
            // const date = subDays(new Date(), 29 - i); // unused
            const dateKey = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');

            const log = history[dateKey];
            // Assuming 5 default habits minimum for 100% calc for now, or dynamic length
            const totalHabits = 5;
            const completion = log ? (log.completedHabits.length / totalHabits) * 100 : 0;

            let bgClass = 'bg-[#222]';
            if (dateKey === format(new Date(), 'yyyy-MM-dd')) bgClass = 'bg-accent-neon animate-pulse';
            else if (log) {
                if (completion === 100) bgClass = 'bg-white shadow-[0_0_10px_white]';
                else if (completion >= 80) bgClass = 'bg-accent-neon shadow-[0_0_8px_#00f2ff]';
                else if (completion > 0) bgClass = 'bg-[#555]';
            }

            return { dateKey, bgClass };
        });
    }, [history]);

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10px,1fr))] gap-1 mb-8 h-8 items-end">
            {matrixDays.map((day) => (
                <div key={day.dateKey} className={`w-full h-full rounded-sm transition-all duration-300 ${day.bgClass}`} />
            ))}
        </div>
    );
};

export const Dashboard = () => {
    const { habits, toggleHabit, history, addHabit, removeHabit, gymStats, theme, setTheme, language, setLanguage } = useProtocolStore();
    const todayKey = getProtocolDate();
    const todayLog = history[todayKey] || { completedHabits: [] };

    // Translation Hook
    const t = APP_TRANSLATIONS[language];

    const completedCount = todayLog.completedHabits.length;
    const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

    // Add Habit Logic
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [newHabitCat, setNewHabitCat] = useState('PHYSICAL');

    // Settings / Theme Logic
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleDelete = (id: string) => {
        if (window.confirm(t.DELETE_CONFIRM)) {
            removeHabit(id);
        }
    };

    const handleAddHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabitTitle) return;
        addHabit({
            id: Date.now().toString(),
            title: newHabitTitle,
            category: newHabitCat
        });
        setNewHabitTitle('');
        setIsAddOpen(false);
    };

    // Membership Check
    const isMembershipExpired = useMemo(() => {
        if (!gymStats.lastPaymentDate) return false;
        const expiry = addDays(new Date(gymStats.lastPaymentDate), 30);
        return isAfter(new Date(), expiry);
    }, [gymStats.lastPaymentDate]);


    // Audio Context
    const playClickSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) { console.error(e); }
    };

    const handleToggle = (id: string) => {
        if (navigator.vibrate) navigator.vibrate(5);
        playClickSound();
        toggleHabit(id);
    };

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative transition-colors duration-300">
            <header className="mb-4 flex justify-between items-start">
                <div>
                    <GlitchText text={t.DASHBOARD_TITLE} className="mb-2" />
                    <div className="flex justify-between items-baseline gap-4">
                        <p className="text-gray-400 text-sm">{t.DAY} {Object.keys(history).length + 1} // {t.COMMIT}</p>
                        <p className="text-xs text-accent-neon font-mono">{getDisplayDate()}</p>
                    </div>
                </div>
                <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 hover:text-accent-neon transition-colors p-1">
                    <Settings size={20} />
                </button>
            </header>

            {isMembershipExpired && (
                <div className="mb-6 bg-accent-alert/10 border border-accent-alert p-3 flex items-center gap-3 animate-pulse">
                    <AlertOctagon className="text-accent-alert" />
                    <div>
                        <p className="text-accent-alert font-bold text-xs uppercase">{t.MEMBERSHIP_EXPIRED}</p>
                        <p className="text-gray-400 text-[10px]">{t.PAY_DEBT}</p>
                    </div>
                </div>
            )}

            {/* The Matrix */}
            <MatrixGrid />

            <div className="mb-8 space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider text-gray-400">
                    <span>{t.DAILY_PROGRESS}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <ProgressBar progress={progress} />
            </div>

            <div className="space-y-4">
                {habits.map((habit) => (
                    <ProtocolToggle
                        key={habit.id}
                        id={habit.id}
                        title={habit.title}
                        completed={todayLog.completedHabits.includes(habit.id)}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                ))}

                <button
                    onClick={() => setIsAddOpen(true)}
                    className="w-full py-4 border border-dashed border-white/10 text-gray-500 text-xs uppercase hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> {t.ADD_PROTOCOL}
                </button>
            </div>

            {/* Add Protocol Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}
                            className="bg-carbonblack border border-accent-neon/30 p-6 rounded w-full max-w-sm"
                        >
                            <div className="flex justify-between mb-6">
                                <h3 className="text-accent-neon font-bold uppercase">{t.NEW_PROTOCOL}</h3>
                                <button onClick={() => setIsAddOpen(false)}><X className="text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleAddHabit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">{t.TITLE_LABEL}</label>
                                    <input
                                        autoFocus
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white outline-none focus:border-accent-neon"
                                        placeholder="e.g. Cold Shower"
                                        value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">{t.CATEGORY_LABEL}</label>
                                    <select
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white outline-none focus:border-accent-neon"
                                        value={newHabitCat} onChange={e => setNewHabitCat(e.target.value)}
                                    >
                                        <option value="PHYSICAL">PHYSICAL</option>
                                        <option value="MENTAL">MENTAL</option>
                                        <option value="SPIRITUAL">SPIRITUAL</option>
                                        <option value="FINANCIAL">FINANCIAL</option>
                                    </select>
                                </div>
                                <button className="w-full bg-accent-neon text-black font-bold py-3 uppercase text-xs tracking-widest hover:bg-white transition-colors">
                                    {t.INIT_PROTOCOL}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings/Theme Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            className="bg-carbonblack border border-accent-neon/30 p-6 rounded w-full max-w-sm overflow-y-auto max-h-[80vh]"
                        >
                            <div className="flex justify-between mb-6">
                                <h3 className="text-accent-neon font-bold uppercase flex items-center gap-2">
                                    <Settings size={16} /> {t.SETTINGS}
                                </h3>
                                <button onClick={() => setIsSettingsOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>

                            <div className="space-y-6">
                                {/* Language */}
                                <div>
                                    <h4 className="text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        <Globe size={14} /> {t.LANGUAGE}
                                    </h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setLanguage('EN')}
                                            className={`flex-1 py-2 text-xs font-bold border rounded transition-colors ${language === 'EN' ? 'bg-accent-neon text-black border-accent-neon' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            ENGLISH
                                        </button>
                                        <button
                                            onClick={() => setLanguage('ES')}
                                            className={`flex-1 py-2 text-xs font-bold border rounded transition-colors ${language === 'ES' ? 'bg-accent-neon text-black border-accent-neon' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            ESPAÑOL
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setTheme('CYBERPUNK')}
                                        className={`w-full p-4 border rounded flex items-center gap-4 transition-all ${theme === 'CYBERPUNK' ? 'border-accent-neon bg-accent-neon/10' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-black border border-[#00F0FF] shadow-[0_0_10px_#00F0FF]" />
                                        <div className="text-left">
                                            <p className="text-white font-bold text-xs uppercase">Cyberpunk</p>
                                            <p className="text-gray-500 text-[10px]">High Contrast // Neon // Default</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTheme('MINIMAL_DARK')}
                                        className={`w-full p-4 border rounded flex items-center gap-4 transition-all ${theme === 'MINIMAL_DARK' ? 'border-white bg-white/10' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#171717] border border-white" />
                                        <div className="text-left">
                                            <p className="text-white font-bold text-xs uppercase">Minimal Dark</p>
                                            <p className="text-gray-500 text-[10px]">Matte // Clean // No Glow</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTheme('MINIMAL_HOLISTIC')}
                                        className={`w-full p-4 border rounded flex items-center gap-4 transition-all ${theme === 'MINIMAL_HOLISTIC' ? 'border-[#86EFAC] bg-[#86EFAC]/10' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#1C1917] border border-[#86EFAC]" />
                                        <div className="text-left">
                                            <p className="text-white font-bold text-xs uppercase">Holistic</p>
                                            <p className="text-gray-500 text-[10px]">Organic // Zen // Stone</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Logout */}
                            <div className="border-t border-white/10 pt-4">
                                <button
                                    onClick={() => {
                                        useAuthStore.getState().logout();
                                        window.location.reload();
                                    }}
                                    className="w-full py-3 bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    {t.LOGOUT}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {progress === 100 && (
                <NeonCard className="mt-8 border-accent-neon/30 bg-accent-neon/5">
                    <h3 className="text-accent-neon text-sm font-bold uppercase mb-2 text-center">{t.PROTOCOL_COMPLETE}</h3>
                </NeonCard>
            )}
        </div>
    );
};
