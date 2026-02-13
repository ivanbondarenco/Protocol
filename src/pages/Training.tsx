import { GlitchText } from '../components/GlitchText';
import { NeonCard } from '../components/NeonCard';
import { Activity, User, CreditCard, Clock } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useProtocolStore } from '../store/useProtocolStore';
import { getProtocolDate } from '../lib/dateUtils';
import { AnimatePresence, motion } from 'framer-motion';

import { APP_TRANSLATIONS } from '../data/translations';

export const Training = () => {
    const { addTrainingLog, trainingLogs, gymStats, updateGymStats, language } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];

    // Input State
    const [mode, setMode] = useState<'LIFT' | 'CARDIO'>('LIFT');
    const [exercise, setExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');

    // Cardio State
    const [cardioTime, setCardioTime] = useState(''); // minutes
    const [cardioDist, setCardioDist] = useState(''); // km
    const [cardioCals, setCardioCals] = useState('');

    // Lookup State
    const [lastHistory, setLastHistory] = useState<string | null>(null);

    // Stats / Bio
    const [showBio, setShowBio] = useState(false);

    // Terminate Modal
    const [isTerminateOpen, setIsTerminateOpen] = useState(false);
    // History Expansion
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    // Unique Exercise List for Autocomplete
    const uniqueExercises = useMemo(() => {
        // Extract base exercise name
        const names = trainingLogs
            .filter(l => l.type === 'LIFT' || !l.type)
            .map(l => l.workout.split(' (')[0].trim());
        return Array.from(new Set(names)).sort();
    }, [trainingLogs]);

    // 1RM Calculation
    const oneRepMax = useMemo(() => {
        const w = parseFloat(weight);
        const r = parseFloat(reps);
        if (!w || !r) return 0;
        return Math.round(w * (1 + r / 30));
    }, [weight, reps]);

    // History Lookup
    useEffect(() => {
        if (!exercise || exercise.length < 3) {
            setLastHistory(null);
            return;
        }
        // Find last log with matching exercise string 
        const historyLog = trainingLogs.find(log => log.workout.toLowerCase().startsWith(exercise.toLowerCase()));
        if (historyLog) {
            setLastHistory(`${historyLog.volume} vol [${historyLog.workout}]`);
        } else {
            setLastHistory(null);
        }
    }, [exercise, trainingLogs]);

    const handleQuickSave = () => {
        if (mode === 'LIFT') {
            if (!exercise || !weight || !reps) return;
            const vol = parseFloat(weight) * parseFloat(reps);

            addTrainingLog({
                id: Date.now().toString(),
                date: getProtocolDate(),
                workout: `${exercise} (${weight}kg x ${reps})`,
                duration: 'Ongoing',
                intensity: 'Medium',
                volume: vol,
                type: 'LIFT'
            });
            setExercise(''); setWeight(''); setReps('');
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

    const handleTerminate = (intensity: string) => {
        setIsTerminateOpen(false);
        alert(`SESSION TERMINATED: ${intensity}`);
    };

    const chartData = useMemo(() => {
        const lastLogs = trainingLogs.slice(0, 7).reverse();
        if (lastLogs.length < 2) return null;
        const maxVol = Math.max(...lastLogs.map(l => l.volume));
        const points = lastLogs.map((log, i) => {
            const x = (i / (lastLogs.length - 1)) * 100;
            const y = 100 - ((log.volume / maxVol) * 100);
            return `${x},${y}`;
        }).join(' ');
        return points;
    }, [trainingLogs]);

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative">
            <header className="mb-4 flex justify-between items-end">
                <div>
                    <GlitchText text={t.TRAINING_TITLE} className="mb-2" />
                    <p className="text-gray-400 text-sm">{t.TRAINING_SUBTITLE}</p>
                </div>
                <button onClick={() => setShowBio(!showBio)} className="text-gray-500 hover:text-white"><User size={20} /></button>
            </header>

            {/* Bio-Metrics & Membership */}
            <AnimatePresence>
                {showBio && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-6 overflow-hidden">
                        <NeonCard className="p-4 border-l-4 border-l-accent-neon bg-carbonblack">
                            <h3 className="text-xs font-bold uppercase text-accent-neon mb-4 flex gap-2 items-center"><User size={14} /> {t.BIO_METRICS}</h3>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 block">{t.WEIGHT.toUpperCase()} (KG)</label>
                                    <input type="number" value={gymStats.weight} onChange={e => updateGymStats({ weight: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 p-2 text-white font-mono" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 block">{t.HEIGHT.toUpperCase()} (CM)</label>
                                    <input type="number" value={gymStats.height} onChange={e => updateGymStats({ height: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 p-2 text-white font-mono" />
                                </div>
                            </div>

                            <h3 className="text-xs font-bold uppercase text-accent-neon mb-4 flex gap-2 items-center"><CreditCard size={14} /> {t.MEMBERSHIP_TITLE}</h3>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 block">{t.LAST_PAYMENT}</label>
                                    <input type="date" value={gymStats.lastPaymentDate} onChange={e => updateGymStats({ lastPaymentDate: e.target.value })} className="w-full bg-black/50 border border-white/10 p-2 text-white font-mono text-xs" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 block">{t.COST}</label>
                                    <input type="number" value={gymStats.monthlyCost} onChange={e => updateGymStats({ monthlyCost: parseFloat(e.target.value) })} className="w-full bg-black/50 border border-white/10 p-2 text-white font-mono" />
                                </div>
                            </div>
                        </NeonCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Section */}
            <NeonCard className="mb-8">
                {/* Mode Toggle */}
                <div className="flex mb-4 border-b border-white/10 pb-2">
                    <button
                        onClick={() => setMode('LIFT')}
                        className={`flex-1 text-xs font-bold uppercase pb-2 ${mode === 'LIFT' ? 'text-accent-neon border-b-2 border-accent-neon' : 'text-gray-500'}`}
                    >
                        {t.LIFT}
                    </button>
                    <button
                        onClick={() => setMode('CARDIO')}
                        className={`flex-1 text-xs font-bold uppercase pb-2 ${mode === 'CARDIO' ? 'text-accent-neon border-b-2 border-accent-neon' : 'text-gray-500'}`}
                    >
                        {t.CARDIO}
                    </button>
                </div>

                <div className="space-y-4">
                    {mode === 'LIFT' ? (
                        <>
                            <div>
                                <input
                                    list="exercises"
                                    placeholder={t.EXERCISE_PLACEHOLDER}
                                    className="w-full bg-black/30 border border-white/10 p-2 text-white uppercase text-sm"
                                    value={exercise} onChange={e => setExercise(e.target.value)}
                                />
                                <datalist id="exercises">
                                    {uniqueExercises.map(name => <option key={name} value={name} />)}
                                </datalist>

                                {lastHistory && <p className="text-[10px] text-accent-neon mt-1 ml-1 flex items-center gap-1"><Clock size={10} /> Last: {lastHistory}</p>}
                            </div>

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
                        <>
                            <div className="flex gap-4">
                                <input
                                    placeholder={t.TIME_PLACEHOLDER}
                                    type="number"
                                    className="w-1/2 bg-black/30 border border-white/10 p-2 text-white text-sm"
                                    value={cardioTime} onChange={e => setCardioTime(e.target.value)}
                                />
                                <input
                                    placeholder={t.DIST_PLACEHOLDER}
                                    type="number"
                                    className="w-1/2 bg-black/30 border border-white/10 p-2 text-white text-sm"
                                    value={cardioDist} onChange={e => setCardioDist(e.target.value)}
                                />
                            </div>
                            <input
                                placeholder={t.CALS_PLACEHOLDER}
                                type="number"
                                className="w-full bg-black/30 border border-white/10 p-2 text-white text-sm"
                                value={cardioCals} onChange={e => setCardioCals(e.target.value)}
                            />
                            <div className="flex justify-end mt-4">
                                <button onClick={handleQuickSave} className="bg-accent-neon text-black px-4 py-2 font-bold text-[10px] uppercase hover:bg-white transition-colors">
                                    {t.LOG_CARDIO}
                                </button>
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
                <div className="bg-carbonblack border border-white/5 h-24 p-4 relative overflow-hidden">
                    {chartData ? (
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <polyline points={chartData} fill="none" stroke="#00f2ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        </svg>
                    ) : <div className="text-center text-xs text-gray-600 mt-8">NO DATA</div>}
                </div>
            </section>

            {/* Log History */}
            <section className="mb-20">
                <h2 className="text-white text-sm font-bold uppercase mb-4 flex items-center gap-2">
                    <Clock size={16} /> {t.LOG_HISTORY}
                </h2>
                <div className="space-y-2">
                    {trainingLogs.slice(0, 5).map((log) => (
                        <div
                            key={log.id}
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="bg-carbonblack border border-white/5 p-3"
                        >
                            <div className="flex justify-between text-[10px] uppercase items-center">
                                <div>
                                    <span className="text-accent-neon font-bold block mb-1">{new Date(log.date).toLocaleDateString()}</span>
                                    <span className="text-white line-clamp-1">{log.workout}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-accent-neon font-bold text-[9px] block">{log.intensity}</span>
                                    <span className="text-gray-400 font-mono block">{log.type === 'CARDIO' ? `${log.calories} kcal` : `${log.volume} vol`}</span>
                                    <span className={`text-[9px] ${log.type === 'CARDIO' ? 'text-blue-400' : 'text-gray-600'}`}>{log.type || 'LIFT'}</span>
                                </div>
                            </div>

                            {/* Detailed View */}
                            <AnimatePresence>
                                {expandedLogId === log.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-2 pt-2 border-t border-white/5"
                                    >
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                                            <div>INTENSITY: <span className="text-white">{log.intensity}</span></div>
                                            <div>DURATION: <span className="text-white">{log.duration}</span></div>
                                            {log.type === 'CARDIO' && (
                                                <>
                                                    <div>DIST: <span className="text-white">{log.distance} km</span></div>
                                                    <div>CALS: <span className="text-white">{log.calories}</span></div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                    {trainingLogs.length === 0 && <p className="text-xs text-gray-500 text-center py-4">{t.NO_LOGS}</p>}
                </div>
            </section>

            {/* Terminate Button */}
            <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto z-10">
                <button onClick={() => setIsTerminateOpen(true)} className="w-full bg-accent-alert text-black font-bold py-3 uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(255,0,60,0.4)] hover:scale-[1.01] transition-transform">
                    {t.TERMINATE_SESSION}
                </button>
            </div>

            {/* Terminate Modal */}
            <AnimatePresence>
                {isTerminateOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
                        <div className="w-full max-w-sm text-center">
                            <GlitchText text={t.SESSION_COMPLETE} size="md" className="mb-8" />
                            <p className="text-xs text-gray-400 mb-6 uppercase tracking-widest">{t.RATE_INTENSITY}</p>
                            <div className="grid gap-3">
                                {['WEAK', 'MAINTENANCE', 'WAR', 'DOMINATED'].map((rate, i) => (
                                    <button
                                        key={rate}
                                        onClick={() => handleTerminate(rate)}
                                        className={`w-full py-4 border border-white/10 uppercase font-bold text-sm tracking-widest hover:bg-accent-neon hover:text-black hover:border-accent-neon transition-all ${i === 3 ? 'text-accent-neon' : 'text-gray-400'}`}
                                    >
                                        {rate}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsTerminateOpen(false)} className="mt-8 text-xs text-gray-600 underline uppercase">{t.CANCEL}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
