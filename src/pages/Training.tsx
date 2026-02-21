import { GlitchText } from '../components/GlitchText';
import { NeonCard } from '../components/NeonCard';
import { Clock, Plus, X, Search, ChevronDown, ChevronUp, BarChart3, CalendarDays, TrendingUp, Filter } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useProtocolStore } from '../store/useProtocolStore';
import { getProtocolDate } from '../lib/dateUtils';
import { AnimatePresence, motion } from 'framer-motion';

import { APP_TRANSLATIONS } from '../data/translations';
import { getExercises, createExercise, type Exercise } from '../services/exerciseService';

type TrendRange = 7 | 14 | 30;
type TrendMetric = 'VOLUME' | 'SESSIONS';
type HistoryFilter = 'ALL' | 'LIFT' | 'CARDIO';

const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatShortDate = (dateKey: string) =>
    new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });

const formatLongDate = (dateKey: string) =>
    new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export const Training = () => {
    const { addTrainingLog, trainingLogs, language, removeTrainingLog } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];

    // Input State
    const [mode, setMode] = useState<'LIFT' | 'CARDIO'>('LIFT');
    const [exercise, setExercise] = useState(''); // Text input for filtering
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');

    // Cardio State
    const [cardioTime, setCardioTime] = useState(''); // minutes
    const [cardioDist, setCardioDist] = useState(''); // km
    const [cardioCals, setCardioCals] = useState('');

    // Local Exercises State
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Add New Exercise Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newExName, setNewExName] = useState('');
    const [newExMuscle, setNewExMuscle] = useState('');

    // Terminate Modal
    const [isTerminateOpen, setIsTerminateOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [trendRange, setTrendRange] = useState<TrendRange>(14);
    const [trendMetric, setTrendMetric] = useState<TrendMetric>('VOLUME');
    const [selectedTrendDate, setSelectedTrendDate] = useState<string | null>(null);
    const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
    const [historySearch, setHistorySearch] = useState('');
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    // Grouped Today's Logs
    const today = getProtocolDate();
    const todaysLogs = trainingLogs.filter(l => l.date === today);

    // Load Exercises on Mount
    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        const data = await getExercises();
        setAllExercises(data);
    };

    // Filter Logic
    useEffect(() => {
        if (!exercise) {
            setFilteredExercises(allExercises);
        } else {
            setFilteredExercises(allExercises.filter(ex =>
                ex.name.toLowerCase().includes(exercise.toLowerCase())
            ));
        }
    }, [exercise, allExercises]);

    const handleSelectExercise = (ex: Exercise) => {
        setExercise(ex.name);
        setSelectedExercise(ex);
        setIsDropdownOpen(false);
    };

    const handleCreateExercise = async () => {
        if (!newExName || !newExMuscle) return;
        const newEx = await createExercise(newExName, newExMuscle);
        if (newEx) {
            await loadExercises(); // Refresh list
            handleSelectExercise(newEx); // Select it
            setIsAddModalOpen(false);
            setNewExName('');
            setNewExMuscle('');
        } else {
            alert('Failed to create exercise');
        }
    };

    // 1RM Calculation
    const oneRepMax = useMemo(() => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);
        if (!w || !r) return 0;
        return Math.round(w * (1 + r / 30));
    }, [weight, reps]);

    // History Lookup
    const lastHistory = useMemo(() => {
        if (!exercise || exercise.length < 3) return null;
        const historyLog = trainingLogs.find(log => log.workout.toLowerCase().startsWith(exercise.toLowerCase()));
        return historyLog ? `${historyLog.volume} vol [${historyLog.workout}]` : null;
    }, [exercise, trainingLogs]);

    const handleQuickSave = () => {
        if (mode === 'LIFT') {
            if (!exercise || !weight || !reps) return;
            const vol = parseFloat(weight) * parseFloat(reps);

            addTrainingLog({
                id: Date.now().toString(),
                date: getProtocolDate(),
                workout: `${exercise} (${weight}kg x ${reps})`, // Keep format
                duration: 'Ongoing',
                intensity: 'Medium',
                volume: vol,
                type: 'LIFT'
            });
            setReps('');
        } else {
            if (!cardioTime || !cardioCals) return;
            addTrainingLog({
                id: Date.now().toString(),
                date: getProtocolDate(),
                workout: `CARDIO: ${cardioTime}m / ${cardioDist || 0}km`,
                duration: `${cardioTime}m`,
                intensity: 'Medium',
                volume: parseFloat(cardioDist || '0'),
                type: 'CARDIO',
                distance: parseFloat(cardioDist || '0'),
                calories: parseFloat(cardioCals)
            });
            setCardioTime(''); setCardioDist(''); setCardioCals('');
        }
    };

    const dailyAggregates = useMemo(() => {
        const byDay: Record<string, { volume: number; sessions: number; cardioMinutes: number }> = {};
        trainingLogs.forEach((log) => {
            if (!byDay[log.date]) byDay[log.date] = { volume: 0, sessions: 0, cardioMinutes: 0 };
            byDay[log.date].sessions += 1;
            byDay[log.date].volume += log.volume || 0;
            if (log.type === 'CARDIO') byDay[log.date].cardioMinutes += parseInt(log.duration) || 0;
        });
        return byDay;
    }, [trainingLogs]);

    const buildTrendSeries = (range: number, startOffset: number) => {
        const now = new Date();
        const series: Array<{ date: string; volume: number; sessions: number; cardioMinutes: number }> = [];
        for (let i = range - 1 + startOffset; i >= startOffset; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const key = toDateKey(d);
            const agg = dailyAggregates[key] || { volume: 0, sessions: 0, cardioMinutes: 0 };
            series.push({ date: key, volume: Math.round(agg.volume), sessions: agg.sessions, cardioMinutes: agg.cardioMinutes });
        }
        return series;
    };

    const trendSeries = useMemo(() => buildTrendSeries(trendRange, 0), [dailyAggregates, trendRange]);
    const previousTrendSeries = useMemo(() => buildTrendSeries(trendRange, trendRange), [dailyAggregates, trendRange]);

    const todayStats = useMemo(() => {
        const liftLogs = todaysLogs.filter((l) => l.type === 'LIFT');
        const cardioLogs = todaysLogs.filter((l) => l.type === 'CARDIO');
        return {
            count: todaysLogs.length,
            totalVolume: Math.round(todaysLogs.reduce((acc, log) => acc + (log.volume || 0), 0)),
            cardioMinutes: cardioLogs.reduce((acc, log) => acc + (parseInt(log.duration) || 0), 0),
            lifts: liftLogs.length,
            cardio: cardioLogs.length
        };
    }, [todaysLogs]);

    useEffect(() => {
        if (trendSeries.length === 0) {
            setSelectedTrendDate(null);
            return;
        }
        if (!selectedTrendDate || !trendSeries.some((point) => point.date === selectedTrendDate)) {
            setSelectedTrendDate(trendSeries[trendSeries.length - 1].date);
        }
    }, [trendSeries, selectedTrendDate]);

    const trendMax = useMemo(
        () => Math.max(1, ...trendSeries.map((point) => trendMetric === 'VOLUME' ? point.volume : point.sessions)),
        [trendSeries, trendMetric]
    );

    const trendTotal = useMemo(
        () => trendSeries.reduce((acc, point) => acc + (trendMetric === 'VOLUME' ? point.volume : point.sessions), 0),
        [trendSeries, trendMetric]
    );

    const previousTrendTotal = useMemo(
        () => previousTrendSeries.reduce((acc, point) => acc + (trendMetric === 'VOLUME' ? point.volume : point.sessions), 0),
        [previousTrendSeries, trendMetric]
    );

    const trendDeltaPct = useMemo(() => {
        if (previousTrendTotal === 0) return trendTotal > 0 ? 100 : 0;
        return Math.round(((trendTotal - previousTrendTotal) / previousTrendTotal) * 100);
    }, [trendTotal, previousTrendTotal]);

    const bestTrendDay = useMemo(() => {
        if (trendSeries.length === 0) return null;
        return trendSeries.reduce((best, current) => {
            const bestValue = trendMetric === 'VOLUME' ? best.volume : best.sessions;
            const currentValue = trendMetric === 'VOLUME' ? current.volume : current.sessions;
            return currentValue > bestValue ? current : best;
        }, trendSeries[0]);
    }, [trendSeries, trendMetric]);

    const selectedTrendPoint = useMemo(() => {
        if (trendSeries.length === 0) return null;
        return trendSeries.find((point) => point.date === selectedTrendDate) || trendSeries[trendSeries.length - 1];
    }, [trendSeries, selectedTrendDate]);

    const sortedLogsDesc = useMemo(
        () => [...trainingLogs].sort((a, b) => b.date.localeCompare(a.date)),
        [trainingLogs]
    );

    const historyRows = useMemo(() => {
        const term = historySearch.trim().toLowerCase();
        const byDate: Record<string, { date: string; logs: typeof trainingLogs; totalVolume: number; sessionCount: number; cardioMinutes: number }> = {};

        sortedLogsDesc.forEach((log) => {
            if (historyFilter !== 'ALL' && log.type !== historyFilter) return;
            if (term && !log.workout.toLowerCase().includes(term)) return;

            if (!byDate[log.date]) {
                byDate[log.date] = {
                    date: log.date,
                    logs: [],
                    totalVolume: 0,
                    sessionCount: 0,
                    cardioMinutes: 0
                };
            }

            byDate[log.date].logs.push(log);
            byDate[log.date].sessionCount += 1;
            byDate[log.date].totalVolume += log.volume || 0;
            if (log.type === 'CARDIO') byDate[log.date].cardioMinutes += parseInt(log.duration) || 0;
        });

        return Object.values(byDate).slice(0, 30);
    }, [sortedLogsDesc, historyFilter, historySearch, trainingLogs]);

    const historyTotals = useMemo(() => ({
        days: historyRows.length,
        sessions: historyRows.reduce((acc, row) => acc + row.sessionCount, 0),
        volume: Math.round(historyRows.reduce((acc, row) => acc + row.totalVolume, 0)),
        cardioMinutes: historyRows.reduce((acc, row) => acc + row.cardioMinutes, 0)
    }), [historyRows]);

    useEffect(() => {
        if (!isHistoryOpen) return;
        setExpandedDates((prev) => {
            const next: Record<string, boolean> = {};
            historyRows.forEach((row, idx) => {
                next[row.date] = prev[row.date] ?? idx === 0;
            });
            return next;
        });
    }, [isHistoryOpen, historyRows]);

    const toggleDateExpanded = (date: string) => {
        setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
    };

    const handleTerminate = (intensity: string) => {
        setIsTerminateOpen(false);
        setExercise(''); setWeight(''); setReps('');
        setCardioTime(''); setCardioDist(''); setCardioCals('');
        setSelectedExercise(null);
        alert(`SESSION TERMINATED: ${intensity}. REST RECOVER REPEAT.`);
    };

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative">
            <header className="mb-4 flex justify-between items-end">
                <div>
                    <GlitchText text={t.TRAINING_TITLE} className="mb-2" />
                    <p className="text-gray-400 text-sm">{t.TRAINING_SUBTITLE}</p>
                </div>
            </header>

            {/* Input Section */}
            <NeonCard className="mb-8 relative overflow-visible z-20">
                <div className="flex mb-4 border-b border-white/10 pb-2">
                    <button onClick={() => setMode('LIFT')} className={`flex-1 text-xs font-bold uppercase pb-2 ${mode === 'LIFT' ? 'text-white border-b-2 border-white/70' : 'text-gray-500'}`}>{t.LIFT}</button>
                    <button onClick={() => { setMode('CARDIO'); setIsStatsOpen(false); }} className={`flex-1 text-xs font-bold uppercase pb-2 ${mode === 'CARDIO' ? 'text-white border-b-2 border-white/70' : 'text-gray-500'}`}>{t.CARDIO}</button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Volumen total</p>
                        <p className="text-lg font-bold text-white">{todayStats.totalVolume}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Bloques</p>
                        <p className="text-lg font-bold text-white">{todayStats.count}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Lifts</p>
                        <p className="text-lg font-bold text-white">{todayStats.lifts}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] text-gray-500 uppercase">Cardio (min)</p>
                        <p className="text-lg font-bold text-white">{todayStats.cardioMinutes}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {mode === 'LIFT' ? (
                        <>
                            <div className="relative">
                                {/* Custom Dropdown / Filter input */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            placeholder="SELECT OR SEARCH EXERCISE"
                                            className="w-full bg-black/30 border border-white/10 p-2 text-white uppercase text-sm"
                                            value={exercise}
                                            onChange={e => {
                                                setExercise(e.target.value);
                                                setIsDropdownOpen(true);
                                                if (selectedExercise && selectedExercise.name !== e.target.value) setSelectedExercise(null);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                        />
                                        <Search className="absolute right-2 top-2 text-gray-500" size={16} />
                                    </div>
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="bg-white/5 border border-white/20 rounded-lg p-2 hover:bg-white/10 transition-colors"
                                    >
                                        <Plus className="text-white" size={20} />
                                    </button>
                                </div>

                                {isDropdownOpen && (
                                    <ul className="absolute top-full left-0 right-12 bg-[#111] border border-white/20 rounded-lg max-h-48 overflow-y-auto z-50 mt-1">
                                        {filteredExercises.length > 0 ? (
                                            filteredExercises.map((ex) => (
                                                <li
                                                    key={ex.id}
                                                    onClick={() => handleSelectExercise(ex)}
                                                    className="p-2 hover:bg-white/10 cursor-pointer text-xs text-gray-300 border-b border-white/5 uppercase flex justify-between"
                                                >
                                                    <span>{ex.name}</span>
                                                    <span className="text-[10px] text-gray-500">{ex.muscleGroup}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-2 text-xs text-gray-500 uppercase">NO RESULT - ADD NEW</li>
                                        )}
                                    </ul>
                                )}
                            </div>

                            {lastHistory && <p className="text-[10px] text-gray-300 mt-1 ml-1 flex items-center gap-1"><Clock size={10} /> Last: {lastHistory}</p>}

                            <div className="flex gap-4">
                                <input
                                    placeholder={t.WEIGHT_PLACEHOLDER}
                                    type="number"
                                    className="w-1/2 bg-black/30 border border-white/10 p-2 text-white text-sm"
                                    value={weight} onChange={e => setWeight(e.target.value)}
                                />
                                <input
                                    placeholder={t.REPS_PLACEHOLDER}
                                    type="number"
                                    className="w-1/2 bg-black/30 border border-white/10 p-2 text-white text-sm"
                                    value={reps} onChange={e => setReps(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <div className="text-xs text-gray-500">
                                    {t.EST_1RM}: <span className="text-white font-bold text-lg">{oneRepMax}</span>
                                </div>
                                <button onClick={handleQuickSave} className="bg-white/5 border border-white/10 text-white px-4 py-2 font-bold text-[10px] uppercase hover:bg-white hover:text-black transition-colors">
                                    {t.LOG_SET}
                                </button>
                            </div>
                        </>
                    ) : (
                        // Cardio UI
                        <>
                            <div className="flex gap-4">
                                <input placeholder={t.TIME_PLACEHOLDER} type="number" className="w-1/2 bg-black/30 border border-white/10 p-2 text-white text-sm" value={cardioTime} onChange={e => setCardioTime(e.target.value)} />
                                <input placeholder={t.DIST_PLACEHOLDER} type="number" className="w-1/2 bg-black/30 border border-white/10 p-2 text-white text-sm" value={cardioDist} onChange={e => setCardioDist(e.target.value)} />
                            </div>
                            <input placeholder={t.CALS_PLACEHOLDER} type="number" className="w-full bg-black/30 border border-white/10 p-2 text-white text-sm" value={cardioCals} onChange={e => setCardioCals(e.target.value)} />
                            <div className="flex justify-end mt-4">
                                <button onClick={handleQuickSave} className="bg-white text-black px-4 py-2 font-bold text-[10px] uppercase hover:bg-gray-200 transition-colors rounded-lg">{t.LOG_CARDIO}</button>
                            </div>
                        </>
                    )}
                </div>
            </NeonCard>

            <section className="mb-4">
                <button
                    type="button"
                    onClick={() => setIsStatsOpen((prev) => !prev)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-200 hover:border-white/40 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                    <span className="flex items-center gap-2">
                        <BarChart3 size={12} />
                        {language === 'ES' ? (isStatsOpen ? 'Ocultar estadisticas' : 'Ver estadisticas') : (isStatsOpen ? 'Hide stats' : 'View stats')}
                    </span>
                    {isStatsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </section>

            {/* Chart */}
            {isStatsOpen && (
                <section className="mb-8">
                    <h2 className="text-white text-sm font-bold uppercase mb-3 flex items-center gap-2">
                        <BarChart3 size={16} /> {t.VOLUME_TREND}
                    </h2>
                    <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1">
                                {[7, 14, 30].map((range) => (
                                    <button
                                        key={range}
                                        type="button"
                                        onClick={() => setTrendRange(range as TrendRange)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors ${trendRange === range ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                        {range}D
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTrendMetric('VOLUME')}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors ${trendMetric === 'VOLUME' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    Volumen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTrendMetric('SESSIONS')}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors ${trendMetric === 'SESSIONS' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                >
                                    Sesiones
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-1">
                            <div className="flex items-end gap-2 min-w-max">
                                {trendSeries.map((point) => {
                                    const value = trendMetric === 'VOLUME' ? point.volume : point.sessions;
                                    const pct = Math.round((value / trendMax) * 100);
                                    const selected = point.date === selectedTrendDate;
                                    return (
                                        <button
                                            key={point.date}
                                            type="button"
                                            onClick={() => setSelectedTrendDate(point.date)}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <div className={`h-24 w-5 rounded-md border ${selected ? 'border-white/60 bg-white/10' : 'border-white/10 bg-black/20'} flex items-end p-[2px]`}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(6, pct)}%` }}
                                                    transition={{ duration: 0.25 }}
                                                    className={`w-full rounded-sm ${selected ? 'bg-white' : 'bg-white/60'}`}
                                                />
                                            </div>
                                            <span className={`text-[9px] ${selected ? 'text-white' : 'text-gray-500'}`}>
                                                {formatShortDate(point.date)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedTrendPoint && (
                            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{formatLongDate(selectedTrendPoint.date)}</p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-gray-500">Vol</p>
                                        <p className="text-white font-semibold">{selectedTrendPoint.volume}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Sesiones</p>
                                        <p className="text-white font-semibold">{selectedTrendPoint.sessions}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Cardio min</p>
                                        <p className="text-white font-semibold">{selectedTrendPoint.cardioMinutes}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                                <p className="text-[9px] uppercase text-gray-500">Total</p>
                                <p className="text-sm text-white font-bold">{trendTotal}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                                <p className="text-[9px] uppercase text-gray-500 flex items-center justify-center gap-1">
                                    <TrendingUp size={10} /> Delta
                                </p>
                                <p className={`text-sm font-bold ${trendDeltaPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trendDeltaPct >= 0 ? '+' : ''}{trendDeltaPct}%
                                </p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                                <p className="text-[9px] uppercase text-gray-500">Mejor dia</p>
                                <p className="text-xs text-white font-semibold">{bestTrendDay ? formatShortDate(bestTrendDay.date) : '--'}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Active Session */}
            <section className="mb-24">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white text-sm font-bold uppercase flex items-center gap-2"><Clock size={16} /> {t.TODAY_SESSION}</h2>
                    <button onClick={() => setIsHistoryOpen(true)} className="text-[10px] bg-white/10 px-3 py-1 rounded text-white hover:bg-white/20 uppercase font-bold">HISTORICO MES</button>
                </div>
                <div className="space-y-4">
                    {todaysLogs.length > 0 ? (
                        todaysLogs.map((log) => (
                            <NeonCard key={log.id} className="p-3 bg-[#141416] border-l-4 border-l-white/60 flex justify-between items-center group">
                                <div>
                                    <h3 className="text-white font-bold uppercase text-xs mb-1">{log.type === 'CARDIO' ? 'CARDIO' : log.workout.match(/\((.*?)\)/)?.[1] || log.workout}</h3>
                                    <p className="text-[10px] text-gray-400 font-mono">{log.type === 'CARDIO' ? `${log.distance}km / ${log.duration}` : log.workout}</p>
                                </div>
                                <button onClick={() => { const globalIndex = trainingLogs.findIndex(l => l.id === log.id); if (globalIndex !== -1) removeTrainingLog(globalIndex); }} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                            </NeonCard>
                        ))
                    ) : <p className="text-xs text-gray-500 text-center py-4">{t.NO_LOGS}</p>}
                </div>
            </section>

            {/* Terminate Button */}
            <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto z-10">
                <button onClick={() => setIsTerminateOpen(true)} className="w-full rounded-xl bg-red-500 text-white font-bold py-3 uppercase text-xs tracking-widest shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:scale-[1.01] transition-transform">
                    {t.TERMINATE_SESSION}
                </button>
            </div>

            {/* Create Exercise Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 text-center">
                        <div className="w-full max-w-sm bg-[#171719] border border-white/15 rounded-2xl p-6 relative">
                            <h3 className="text-white font-bold uppercase mb-4">ADD NEW EXERCISE</h3>
                            <input placeholder="EXERCISE NAME" className="w-full bg-black/50 border border-white/10 p-2 text-white mb-2 text-xs uppercase" value={newExName} onChange={e => setNewExName(e.target.value)} />
                            <select className="w-full bg-black/50 border border-white/10 p-2 text-white mb-4 text-xs uppercase" value={newExMuscle} onChange={e => setNewExMuscle(e.target.value)}>
                                <option value="">SELECT MUSCLE GROUP</option>
                                {['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'CARDIO', 'OTHER'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-800 text-white py-2 text-xs uppercase font-bold">CANCEL</button>
                                <button onClick={handleCreateExercise} className="flex-1 bg-white text-black py-2 text-xs uppercase font-bold rounded-lg">SAVE</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Terminate Modal */}
            <AnimatePresence>
                {isTerminateOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
                        <div className="w-full max-w-sm text-center">
                            <GlitchText text={t.SESSION_COMPLETE} size="md" className="mb-8" />
                            <p className="text-xs text-gray-400 mb-6 uppercase tracking-widest">{t.RATE_INTENSITY}</p>
                            <div className="grid gap-3">
                                {['WEAK', 'MAINTENANCE', 'WAR', 'DOMINATED'].map((rate, i) => (
                                    <button key={rate} onClick={() => handleTerminate(rate)} className={`w-full py-4 border border-white/10 uppercase font-bold text-sm tracking-widest hover:bg-white hover:text-black hover:border-white/60 transition-all ${i === 3 ? 'text-white' : 'text-gray-400'}`}>{rate}</button>
                                ))}
                            </div>
                            <button onClick={() => setIsTerminateOpen(false)} className="mt-8 text-xs text-gray-600 underline uppercase">{t.CANCEL}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 p-4 overflow-y-auto backdrop-blur-sm">
                        <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-[#0f1110]/95 p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold uppercase text-sm flex items-center gap-2">
                                    <CalendarDays size={14} /> Historico del mes
                                </h3>
                                <button onClick={() => setIsHistoryOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <button type="button" onClick={() => setHistoryFilter('ALL')} className={`py-2 rounded-lg text-[10px] font-bold uppercase border ${historyFilter === 'ALL' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>Todo</button>
                                <button type="button" onClick={() => setHistoryFilter('LIFT')} className={`py-2 rounded-lg text-[10px] font-bold uppercase border ${historyFilter === 'LIFT' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>LIFT</button>
                                <button type="button" onClick={() => setHistoryFilter('CARDIO')} className={`py-2 rounded-lg text-[10px] font-bold uppercase border ${historyFilter === 'CARDIO' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>CARDIO</button>
                                <div className="py-2 rounded-lg text-[10px] font-bold uppercase border border-white/10 text-gray-500 flex items-center justify-center gap-1">
                                    <Filter size={10} /> Filtro
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                                <input
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    placeholder="Buscar por ejercicio..."
                                    className="w-full rounded-lg bg-black/40 border border-white/10 pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-white/40"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                                    <p className="text-[9px] text-gray-500 uppercase">Dias</p>
                                    <p className="text-sm text-white font-bold">{historyTotals.days}</p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                                    <p className="text-[9px] text-gray-500 uppercase">Sesiones</p>
                                    <p className="text-sm text-white font-bold">{historyTotals.sessions}</p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                                    <p className="text-[9px] text-gray-500 uppercase">Vol</p>
                                    <p className="text-sm text-white font-bold">{historyTotals.volume}</p>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                                    <p className="text-[9px] text-gray-500 uppercase">Cardio</p>
                                    <p className="text-sm text-white font-bold">{historyTotals.cardioMinutes}m</p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                                {historyRows.length === 0 && (
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-xs text-gray-500">
                                        Sin datos para ese filtro.
                                    </div>
                                )}

                                {historyRows.map((row) => {
                                    const isOpen = !!expandedDates[row.date];
                                    return (
                                        <div key={row.date} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => toggleDateExpanded(row.date)}
                                                className="w-full px-3 py-2.5 flex items-center justify-between text-left"
                                            >
                                                <div>
                                                    <p className="text-xs text-white font-semibold">{formatLongDate(row.date)}</p>
                                                    <p className="text-[10px] text-gray-500">{row.sessionCount} sesiones // {Math.round(row.totalVolume)} vol // {row.cardioMinutes}m cardio</p>
                                                </div>
                                                {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                            </button>

                                            {isOpen && (
                                                <div className="px-3 pb-3 space-y-2">
                                                    {row.logs.map((log) => (
                                                        <div key={log.id} className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] text-white truncate">{log.workout}</p>
                                                                <p className="text-[10px] text-gray-500">
                                                                    {log.type === 'CARDIO'
                                                                        ? `${log.duration} // ${log.calories || 0} kcal`
                                                                        : `LIFT // ${Math.round(log.volume || 0)} vol`}
                                                                </p>
                                                            </div>
                                                            <span className="text-[11px] font-semibold text-white shrink-0">
                                                                {log.type === 'CARDIO'
                                                                    ? `${log.distance || 0} km`
                                                                    : `${Math.round(log.volume || 0)} vol`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
