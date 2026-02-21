import { GlitchText } from '../components/GlitchText';
import { NeonCard } from '../components/NeonCard';
import { Activity, Clock, Plus, X, Search } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useProtocolStore } from '../store/useProtocolStore';
import { getProtocolDate } from '../lib/dateUtils';
import { AnimatePresence, motion } from 'framer-motion';

import { APP_TRANSLATIONS } from '../data/translations';
import { getExercises, createExercise, type Exercise } from '../services/exerciseService';

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

    // Chart Data
    const chartData = useMemo(() => {
        if (trainingLogs.length === 0) return null;
        const volByDate: Record<string, number> = {};
        [...trainingLogs].sort((a, b) => a.date.localeCompare(b.date)).forEach(l => {
            if (l.volume) volByDate[l.date] = (volByDate[l.date] || 0) + l.volume;
        });
        const dates = Object.keys(volByDate);
        if (dates.length < 2) return "0,100 100,100"; // Flat line if not enough data
        const vols = Object.values(volByDate);
        const max = Math.max(...vols) || 100;
        return dates.map((d, i) => {
            const x = (i / (dates.length - 1)) * 100;
            const y = 100 - ((volByDate[d] / max) * 100);
            return `${x},${y}`;
        }).join(' ');
    }, [trainingLogs]);

    const weekVolumeSeries = useMemo(() => {
        const byDay: Record<string, number> = {};
        trainingLogs.forEach((log) => {
            byDay[log.date] = (byDay[log.date] || 0) + (log.volume || 0);
        });
        const points = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
        const max = Math.max(1, ...points.map(([, v]) => v));
        return points.map(([date, vol]) => ({ date, vol, pct: Math.round((vol / max) * 100) }));
    }, [trainingLogs]);

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
                    <button onClick={() => setMode('LIFT')} className={`flex-1 text-xs font-bold uppercase pb-2 ${mode === 'LIFT' ? 'text-accent-neon border-b-2 border-accent-neon' : 'text-gray-500'}`}>{t.LIFT}</button>
                    <button onClick={() => setMode('CARDIO')} className={`flex-1 text-xs font-bold uppercase pb-2 ${mode === 'CARDIO' ? 'text-accent-neon border-b-2 border-accent-neon' : 'text-gray-500'}`}>{t.CARDIO}</button>
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
                                        className="bg-accent-neon/10 border border-accent-neon/30 p-2 hover:bg-accent-neon/20"
                                    >
                                        <Plus className="text-accent-neon" size={20} />
                                    </button>
                                </div>

                                {isDropdownOpen && (
                                    <ul className="absolute top-full left-0 right-12 bg-black border border-accent-neon/30 max-h-48 overflow-y-auto z-50 mt-1">
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

                            {lastHistory && <p className="text-[10px] text-accent-neon mt-1 ml-1 flex items-center gap-1"><Clock size={10} /> Last: {lastHistory}</p>}

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
                                    {t.EST_1RM}: <span className="text-accent-neon font-bold text-lg">{oneRepMax}</span>
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
                                <button onClick={handleQuickSave} className="bg-accent-neon text-black px-4 py-2 font-bold text-[10px] uppercase hover:bg-white transition-colors">{t.LOG_CARDIO}</button>
                            </div>
                        </>
                    )}
                </div>
            </NeonCard>

            {/* Chart */}
            <section className="mb-8">
                <h2 className="text-white text-sm font-bold uppercase mb-4 flex items-center gap-2">
                    <Activity size={16} /> {t.VOLUME_TREND}
                </h2>
                <div className="bg-carbonblack border border-white/5 p-4 relative overflow-hidden rounded-xl">
                    {chartData ? (
                        <>
                            <div className="h-24 mb-3">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <polyline points={chartData} fill="none" stroke="#00f2ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                </svg>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {weekVolumeSeries.map((point) => (
                                    <div key={point.date} className="text-center">
                                        <div className="h-10 bg-white/5 rounded flex items-end">
                                            <div className="w-full bg-accent-neon/70 rounded-b" style={{ height: `${Math.max(8, point.pct)}%` }} />
                                        </div>
                                        <p className="text-[9px] text-gray-500 mt-1">
                                            {new Date(point.date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : <div className="text-center text-xs text-gray-600 py-8">NO DATA</div>}
                </div>
            </section>

            {/* Active Session */}
            <section className="mb-24">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white text-sm font-bold uppercase flex items-center gap-2"><Clock size={16} /> {t.TODAY_SESSION}</h2>
                    <button onClick={() => setIsHistoryOpen(true)} className="text-[10px] bg-white/10 px-3 py-1 rounded text-white hover:bg-white/20 uppercase font-bold">HISTÓRICO MES</button>
                </div>
                <div className="space-y-4">
                    {todaysLogs.length > 0 ? (
                        todaysLogs.map((log) => (
                            <NeonCard key={log.id} className="p-3 bg-carbonblack border-l-4 border-l-accent-neon flex justify-between items-center group">
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
                <button onClick={() => setIsTerminateOpen(true)} className="w-full bg-accent-alert text-black font-bold py-3 uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(255,0,60,0.4)] hover:scale-[1.01] transition-transform">
                    {t.TERMINATE_SESSION}
                </button>
            </div>

            {/* Create Exercise Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 text-center">
                        <div className="w-full max-w-sm bg-carbonblack border border-accent-neon p-6 relative">
                            <h3 className="text-accent-neon font-bold uppercase mb-4">ADD NEW EXERCISE</h3>
                            <input placeholder="EXERCISE NAME" className="w-full bg-black/50 border border-white/10 p-2 text-white mb-2 text-xs uppercase" value={newExName} onChange={e => setNewExName(e.target.value)} />
                            <select className="w-full bg-black/50 border border-white/10 p-2 text-white mb-4 text-xs uppercase" value={newExMuscle} onChange={e => setNewExMuscle(e.target.value)}>
                                <option value="">SELECT MUSCLE GROUP</option>
                                {['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'CARDIO', 'OTHER'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-800 text-white py-2 text-xs uppercase font-bold">CANCEL</button>
                                <button onClick={handleCreateExercise} className="flex-1 bg-accent-neon text-black py-2 text-xs uppercase font-bold">SAVE</button>
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
                                    <button key={rate} onClick={() => handleTerminate(rate)} className={`w-full py-4 border border-white/10 uppercase font-bold text-sm tracking-widest hover:bg-accent-neon hover:text-black hover:border-accent-neon transition-all ${i === 3 ? 'text-accent-neon' : 'text-gray-400'}`}>{rate}</button>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 p-6 overflow-y-auto">
                        <div className="flex justify-between mb-6">
                            <h3 className="text-accent-neon font-bold uppercase">HISTORY (30 DAYS)</h3>
                            <button onClick={() => setIsHistoryOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                        </div>
                        <div className="space-y-6">
                            {Array.from(new Set(trainingLogs.map(l => l.date))).slice(0, 30).map(date => (
                                <div key={date}>
                                    <h4 className="text-white text-xs font-bold bg-white/10 px-2 py-1 mb-2 inline-block rounded">{new Date(date).toLocaleDateString()}</h4>
                                    <div className="space-y-2 pl-2 border-l border-white/10">
                                        {trainingLogs.filter(l => l.date === date).map(log => (
                                            <div key={log.id} className="text-[10px] text-gray-400 flex justify-between">
                                                <span>{log.workout}</span>
                                                <span className="text-accent-neon">{log.volume} vol</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
