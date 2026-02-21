import { useProtocolStore } from '../store/useProtocolStore';
import { useAuthStore } from '../store/useAuthStore';
import { GlitchText } from '../components/GlitchText';
import { ProtocolToggle } from '../components/ProtocolToggle';
import { ProgressBar } from '../components/ProgressBar';
import { NeonCard } from '../components/NeonCard';
import { getProtocolDate, getDisplayDate } from '../lib/dateUtils';
import { subDays, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Settings, Plus, X, Globe, User, Activity, Users, ArrowRight, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_TRANSLATIONS } from '../data/translations';
import { ProfileModal } from '../components/profile/ProfileModal';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

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
    const [socialSummary, setSocialSummary] = useState<{ allies: number; invites: number; unreadPings: number; sparks: number }>({
        allies: 0,
        invites: 0,
        unreadPings: 0,
        sparks: 0
    });
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

    useEffect(() => {
        const loadSocialSummary = async () => {
            try {
                const [alliesRes, invitesRes, pingsRes, sparksRes] = await Promise.all([
                    api.get('/social/allies'),
                    api.get('/social/invites'),
                    api.get('/social/pings'),
                    api.get('/social/sparks/feed')
                ]);

                const pings = (pingsRes.pings || []) as Array<{ seen?: boolean }>;
                setSocialSummary({
                    allies: (alliesRes.allies || []).length,
                    invites: (invitesRes.invitations || []).length,
                    unreadPings: pings.filter((p) => !p.seen).length,
                    sparks: (sparksRes.sparks || []).length
                });
            } catch (e) {
                console.error('Could not load social summary', e);
            }
        };

        loadSocialSummary();
    }, []);

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
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative transition-colors duration-300">
            <header className="mb-4 flex justify-between items-start">
                <div>
                    <GlitchText text={t.DASHBOARD_TITLE} className="mb-2" />
                    <div className="flex justify-between items-baseline gap-4">
                        <p className="text-gray-400 text-sm">{t.DAY} {Object.keys(history).length + 1} // {t.COMMIT}</p>
                        <p className="text-xs text-accent-neon font-mono">{getDisplayDate()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsProfileOpen(true)} className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-accent-neon transition-colors">
                        {bioData.avatar ? (
                            <img src={bioData.avatar} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center text-gray-500">
                                <User size={16} />
                            </div>
                        )}
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="text-gray-500 hover:text-accent-neon transition-colors p-1">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {isProfileOpen && (
                    <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                )}
            </AnimatePresence>

            <section className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-orange-300">Racha actual</p>
                        <p className="text-white text-2xl font-black">{currentStreak} dias</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-500/15 border border-orange-400/40 flex items-center justify-center">
                        <Flame size={20} className="text-orange-400 fill-orange-500/40" />
                    </div>
                </div>
                <p className="text-[11px] text-orange-100/70 mt-1">Se mantiene automatica al completar todos tus habitos del dia.</p>
            </section>

            <section className="mb-5 grid grid-cols-2 gap-3">
                <Link to="/social" className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Social</p>
                        <Users size={14} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-white font-semibold">{socialSummary.allies} aliados</p>
                    <p className="text-[11px] text-gray-500">{socialSummary.unreadPings} pings // {socialSummary.sparks} chispas</p>
                    <div className="mt-2 text-[10px] text-gray-400 uppercase flex items-center gap-1">
                        Ver social <ArrowRight size={12} />
                    </div>
                </Link>

                <button onClick={openInsights} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/30 transition-colors text-left">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Insights</p>
                        <Activity size={14} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-white font-semibold">Score {weeklyInsights?.score ?? '--'}</p>
                    <p className="text-[11px] text-gray-500">{socialSummary.invites} invitaciones pendientes</p>
                    <div className="mt-2 text-[10px] text-gray-400 uppercase flex items-center gap-1">
                        Ver insights <ArrowRight size={12} />
                    </div>
                </button>
            </section>

            <div className="mb-8 space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-wider text-gray-400">
                    <span>{t.DAILY_PROGRESS}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <ProgressBar progress={progress} />
            </div>

            <div className="space-y-4">
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
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                        <p className="text-xs text-gray-300 uppercase mb-1">No hay habitos para hoy</p>
                        <p className="text-[11px] text-gray-500">Usa el boton flotante para agregar uno rapido.</p>
                    </div>
                )}
            </div>

            {/* The Matrix */}
            <div className="mt-7">
                <MatrixGrid />
            </div>

            <button
                onClick={() => setIsAddOpen(true)}
                className="fixed bottom-28 right-4 z-40 rounded-full bg-white text-black px-4 py-3 text-xs font-bold uppercase tracking-wider shadow-[0_12px_36px_rgba(255,255,255,0.25)] hover:scale-[1.02] transition-transform flex items-center gap-2"
            >
                <Plus size={14} /> {t.ADD_PROTOCOL}
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
                                <div>
                                    <label className="text-xs text-gray-500 uppercase block mb-1">REPETICION</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewHabitRepeat('DAILY')}
                                            className={`py-2 text-xs border ${newHabitRepeat === 'DAILY' ? 'border-accent-neon text-accent-neon' : 'border-white/10 text-gray-500'}`}
                                        >
                                            TODOS LOS DIAS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewHabitRepeat('WEEKLY')}
                                            className={`py-2 text-xs border ${newHabitRepeat === 'WEEKLY' ? 'border-accent-neon text-accent-neon' : 'border-white/10 text-gray-500'}`}
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
                                                        className={`py-2 text-xs border ${active ? 'border-accent-neon text-accent-neon' : 'border-white/10 text-gray-500'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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
                <NeonCard className="mt-8 border-accent-neon/30 bg-accent-neon/5">
                    <h3 className="text-accent-neon text-sm font-bold uppercase mb-2 text-center">{t.PROTOCOL_COMPLETE}</h3>
                </NeonCard>
            )}
        </div>
    );
};
