import { useProtocolStore } from '../store/useProtocolStore';
import { useAuthStore } from '../store/useAuthStore';
import { GlitchText } from '../components/GlitchText';
import { ProtocolToggle } from '../components/ProtocolToggle';
import { ProgressBar } from '../components/ProgressBar';
import { NeonCard } from '../components/NeonCard';
import { getProtocolDate, getDisplayDate } from '../lib/dateUtils';
import { addDays, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Settings, Plus, X, Globe, User, Activity, ArrowRight, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_TRANSLATIONS } from '../data/translations';
import { ProfileModal } from '../components/profile/ProfileModal';
import { api } from '../lib/api';

// Matrix Component
const MatrixGrid = () => {
    const { history, getDailyCompletion } = useProtocolStore();
    const user = useAuthStore((state) => state.user);
    const TOTAL_SLOTS = 70;

    const accountStartKey = useMemo(() => {
        if (user?.createdAt) {
            const created = new Date(user.createdAt);
            if (!Number.isNaN(created.getTime())) {
                return format(created, 'yyyy-MM-dd');
            }
        }
        const historyKeys = Object.keys(history).sort();
        if (historyKeys.length > 0) return historyKeys[0];
        return format(new Date(), 'yyyy-MM-dd');
    }, [history, user?.createdAt]);

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const matrixDays = useMemo(() => {
        const startDate = new Date(`${accountStartKey}T00:00:00`);

        return Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
            const dateKey = format(addDays(startDate, i), 'yyyy-MM-dd');
            const isFuture = dateKey > todayKey;
            const completion = isFuture ? { done: 0, total: 0 } : getDailyCompletion(dateKey);
            const ratio = completion.total > 0 ? completion.done / completion.total : 0;
            let bgClass = 'bg-[#2f3338]';
            if (ratio >= 1) bgClass = 'bg-[#4dd06a]';
            else if (ratio >= 0.67) bgClass = 'bg-[#35a153]';
            else if (ratio >= 0.34) bgClass = 'bg-[#2a6b3d]';
            else if (ratio > 0) bgClass = 'bg-[#1f4028]';

            return {
                dateKey,
                bgClass,
                done: completion.done,
                total: completion.total,
                isFuture,
                isToday: dateKey === todayKey
            };
        });
    }, [accountStartKey, getDailyCompletion, todayKey]);

    const matrixWeeks = useMemo(() => {
        return Array.from({ length: 10 }).map((_, weekIndex) =>
            matrixDays.slice(weekIndex * 7, weekIndex * 7 + 7)
        );
    }, [matrixDays]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">
                <span className="flex items-center gap-1.5">
                    <Activity size={12} className="text-gray-600" />
                    Ritmo semanal
                </span>
                <span className="opacity-60">{TOTAL_SLOTS} días</span>
            </div>

            <div className="w-full">
                <div className="grid w-full grid-cols-10 gap-[4px]">
                    {matrixWeeks.map((week, weekIndex) => (
                        <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-[4px]">
                            {week.map((day) => (
                                <div
                                    key={day.dateKey}
                                    className={`aspect-square w-full rounded-[3px] border border-black/20 transition-all duration-500 ${day.bgClass} ${day.isFuture ? 'opacity-20' : ''} ${day.isToday ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-voidblack' : ''}`}
                                    title={`${day.dateKey} // ${day.done}/${day.total || 0}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-gray-500/80 font-medium">
                <span>Inicio {new Date(`${accountStartKey}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}</span>
                <div className="flex items-center gap-1.5 bg-white/5 p-1 px-2 rounded-full border border-white/5">
                    <span className="h-2 w-2 rounded-full bg-[#2f3338]" />
                    <span className="h-2 w-2 rounded-full bg-[#4dd06a] shadow-[0_0_8px_#4dd06a44]" />
                    <span className="text-gray-400 ml-1">Intensidad</span>
                </div>
            </div>
        </div>
    );
};

export const Dashboard = () => {
    const { habits, toggleHabit, history, addHabit, removeHabit, theme, setTheme, language, setLanguage, bioData, getCurrentStreak } = useProtocolStore();
    const todayKey = getProtocolDate();
    const todayLog = history[todayKey] || { completedHabits: [] };

    // Translation Hook
    const t = APP_TRANSLATIONS[language];

    const todayWeekDay = new Date().getDay();
    const scheduledHabits = habits.filter((habit) =>
        habit.repeat === 'DAILY' || (habit.repeat === 'WEEKLY' && (habit.repeatDays || []).includes(todayWeekDay))
    );
    const completedCount = scheduledHabits.filter(h => todayLog.completedHabits.includes(h.id)).length;
    const progress = scheduledHabits.length > 0 ? (completedCount / scheduledHabits.length) * 100 : 0;

    // Add Habit Logic
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [newHabitCat, setNewHabitCat] = useState('PHYSICAL');
    const [newHabitRepeat, setNewHabitRepeat] = useState<'DAILY' | 'WEEKLY'>('DAILY');
    const [newHabitDays, setNewHabitDays] = useState<number[]>([]);

    // Settings / Theme Logic
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [weeklyInsights, setWeeklyInsights] = useState<{ score: number; completeDays: number; recommendations: string[] } | null>(null);
    const [isInsightsOpen, setIsInsightsOpen] = useState(false);
    const currentStreak = getCurrentStreak();

    useEffect(() => {
        const load = async () => {
            try {
                const insights = await api.get('/insights/weekly');
                setWeeklyInsights({
                    score: insights.score,
                    completeDays: insights.completeDays,
                    recommendations: insights.recommendations || []
                });
            } catch (e) {
                console.error('Could not load dashboard intelligence', e);
            }
        };
        load();
    }, [history]);

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
            category: newHabitCat,
            repeat: newHabitRepeat,
            repeatDays: newHabitRepeat === 'WEEKLY' ? newHabitDays : undefined
        });
        setNewHabitTitle('');
        setNewHabitRepeat('DAILY');
        setNewHabitDays([]);
        setIsAddOpen(false);
    };

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

    const openInsights = async () => {
        if (!weeklyInsights) {
            try {
                const insights = await api.get('/insights/weekly');
                setWeeklyInsights({
                    score: insights.score,
                    completeDays: insights.completeDays,
                    recommendations: insights.recommendations || []
                });
            } catch (e) {
                console.error('Could not load weekly insights for modal', e);
            }
        }
        setIsInsightsOpen(true);
    };

    return (
        <div className="min-h-screen bg-voidblack pb-32 px-5 pt-8 max-w-md mx-auto relative transition-colors duration-300">
            <header className="mb-8 flex justify-between items-center">
                <div className="space-y-1">
                    <GlitchText text={t.DASHBOARD_TITLE} size="xl" />
                    <div className="flex items-center gap-2 opacity-60">
                        <Activity size={12} className="text-gray-400" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                            Día {Object.keys(history).length + 1} // {getDisplayDate()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsProfileOpen(true)} className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-all p-0.5 bg-gradient-to-br from-white/10 to-transparent">
                        {bioData.avatar ? (
                            <img src={bioData.avatar} alt="User" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-voidblack flex items-center justify-center text-gray-500 rounded-full">
                                <User size={16} />
                            </div>
                        )}
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {isProfileOpen && (
                    <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                )}
            </AnimatePresence>

            {/* Main Priority: Streak KPI (Horizontal) */}
            <section className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-center justify-between overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                        <Flame size={24} className="text-orange-500 fill-orange-500/20" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-orange-400/70 font-black">Racha Actual</p>
                        <p className="text-white text-2xl font-black">{currentStreak} días</p>
                    </div>
                </div>
                <div className="text-right relative">
                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight tracking-wider">Protocolo<br />Activo</p>
                </div>
            </section>

            {/* Second Priority: Weekly Rhythm (Featured Card) */}
            <section className="mb-8">
                <NeonCard className="border-white/5 bg-white/[0.02] p-5 rounded-[24px]">
                    <MatrixGrid />
                    <button
                        onClick={openInsights}
                        className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors border-t border-white/5 pt-4"
                    >
                        Ver Insights <ArrowRight size={12} />
                    </button>
                </NeonCard>
            </section>

            <div className="mb-8 space-y-3">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">{t.DAILY_PROGRESS}</span>
                    <span className="text-xs font-mono text-white font-black">{Math.round(progress)}%</span>
                </div>
                <ProgressBar progress={progress} />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Hábitos de hoy</h2>
                    <span className="text-[10px] font-mono text-gray-600">{completedCount}/{scheduledHabits.length}</span>
                </div>
                {scheduledHabits.map((habit) => (
                    <ProtocolToggle
                        key={habit.id}
                        id={habit.id}
                        title={habit.title}
                        completed={todayLog.completedHabits.includes(habit.id)}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                ))}
                {scheduledHabits.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Sin protocolos activos</p>
                        <p className="text-[11px] text-gray-600">Presiona el botón + para iniciar tu día.</p>
                    </div>
                )}
            </div>

            {/* FAB: Primary Action (Thumb accessible) */}
            <button
                onClick={() => setIsAddOpen(true)}
                className="fixed bottom-24 right-6 z-40 w-16 h-16 rounded-3xl bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-90 transition-all flex items-center justify-center border border-white/20 group"
            >
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
            </button>

            {/* Add Protocol Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}
                            className="bg-[#171719] border border-white/15 p-6 rounded-2xl w-full max-w-sm"
                        >
                            <div className="flex justify-between mb-6">
                                <h3 className="text-white font-bold uppercase">{t.NEW_PROTOCOL}</h3>
                                <button onClick={() => setIsAddOpen(false)}><X className="text-gray-500" /></button>
                            </div>
                            <form onSubmit={handleAddHabit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">{t.TITLE_LABEL}</label>
                                    <input
                                        autoFocus
                                        className="w-full rounded-xl bg-black/50 border border-white/10 p-3 text-white outline-none focus:border-white/40"
                                        placeholder="e.g. Cold Shower"
                                        value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">{t.CATEGORY_LABEL}</label>
                                    <select
                                        className="w-full rounded-xl bg-black/50 border border-white/10 p-3 text-white outline-none focus:border-white/40"
                                        value={newHabitCat} onChange={e => setNewHabitCat(e.target.value)}
                                    >
                                        <option value="PHYSICAL">PHYSICAL</option>
                                        <option value="MENTAL">MENTAL</option>
                                        <option value="SPIRITUAL">SPIRITUAL</option>
                                        <option value="FINANCIAL">FINANCIAL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">REPETICION</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewHabitRepeat('DAILY')}
                                            className={`rounded-xl py-2 text-xs border transition-colors ${newHabitRepeat === 'DAILY' ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            TODOS LOS DIAS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewHabitRepeat('WEEKLY')}
                                            className={`rounded-xl py-2 text-xs border transition-colors ${newHabitRepeat === 'WEEKLY' ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            DIAS ESPECIFICOS
                                        </button>
                                    </div>
                                </div>
                                {newHabitRepeat === 'WEEKLY' && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">DIAS</label>
                                        <div className="grid grid-cols-7 gap-1">
                                            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                                                const active = newHabitDays.includes(i);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => setNewHabitDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                                                        className={`rounded-lg py-2 text-xs border transition-colors ${active ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                <button className="w-full rounded-xl bg-white text-black font-bold py-3 uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors">
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
                            className="bg-[#171719] border border-white/15 p-6 rounded-2xl w-full max-w-sm overflow-y-auto max-h-[80vh]"
                        >
                            <div className="flex justify-between mb-6">
                                <h3 className="text-white font-bold uppercase flex items-center gap-2">
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
                                            className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-colors ${language === 'EN' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            ENGLISH
                                        </button>
                                        <button
                                            onClick={() => setLanguage('ES')}
                                            className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-colors ${language === 'ES' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            ESPANOL
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
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
                                            <p className="text-gray-500 text-[10px]">Organic // Earthy // Focused</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTheme('MINIMAL_LIGHT')}
                                        className={`w-full p-4 border rounded flex items-center gap-4 transition-all ${theme === 'MINIMAL_LIGHT' ? 'border-[#111827] bg-[#111827]/10' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[#f5f5f7] border border-[#111827]" />
                                        <div className="text-left">
                                            <p className="text-white font-bold text-xs uppercase">Minimal Light</p>
                                            <p className="text-gray-500 text-[10px]">Apple-like // Clean // Bright</p>
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

            <AnimatePresence>
                {isInsightsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/85 z-50 p-4 flex items-center justify-center"
                        onClick={() => setIsInsightsOpen(false)}
                    >
                        <motion.div
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 16, opacity: 0 }}
                            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#131313] p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold uppercase text-white">Insights Semanales</h3>
                                <button onClick={() => setIsInsightsOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                            {!weeklyInsights && <p className="text-xs text-gray-500">Cargando...</p>}
                            {weeklyInsights && (
                                <div className="space-y-3">
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <p className="text-[10px] uppercase text-gray-500 mb-1">Score</p>
                                        <p className="text-2xl font-bold text-white">{weeklyInsights.score}</p>
                                        <p className="text-[11px] text-gray-400">Dias completos: {weeklyInsights.completeDays}/7</p>
                                    </div>
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <p className="text-[10px] uppercase text-gray-500 mb-2">Recomendacion principal</p>
                                        <p className="text-xs text-gray-300">{weeklyInsights.recommendations[0] || 'Sin recomendaciones por ahora.'}</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {progress === 100 && (
                <NeonCard className="mt-8 border-white/20 bg-white/5">
                    <h3 className="text-white text-sm font-bold uppercase mb-2 text-center">{t.PROTOCOL_COMPLETE}</h3>
                </NeonCard>
            )}
        </div>
    );
};
