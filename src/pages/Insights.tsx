import { useEffect, useState } from 'react';
import { GlitchText } from '../components/GlitchText';
import { api } from '../lib/api';
import { Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface WeeklyInsights {
    streak: number;
    avgCompletion: number;
    completeDays: number;
    score: number;
    components: {
        consistencyScore: number;
        executionScore: number;
        recoveryScore: number;
        focusScore: number;
    };
    recommendations: string[];
}

const infoItems = [
    { title: 'Consistencia', text: 'Que tan seguido completas tus habitos en la semana (dias completos / 7).' },
    { title: 'Ejecucion', text: 'Que porcentaje promedio de habitos ejecutas cada dia.' },
    { title: 'Recuperacion', text: 'Como recuperas continuidad tras un dia flojo (rebote de cumplimiento).' },
    { title: 'Foco', text: 'Capacidad de sostener racha y priorizar habitos clave sin dispersarte.' },
];

export const Insights = () => {
    const [data, setData] = useState<WeeklyInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const insights = await api.get('/insights/weekly');
                setData(insights);
            } catch (e) {
                console.error('Insights load failed', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <GlitchText text="INSIGHTS" />
                    <button onClick={() => setIsInfoOpen(true)} className="p-2 border border-white/15 rounded-lg text-gray-300 hover:text-white hover:border-white/30">
                        <Info size={16} />
                    </button>
                </div>
                <p className="text-gray-400 text-sm">Resumen semanal de consistencia y ejecucion.</p>
            </header>

            {loading && <div className="text-sm text-gray-500">Cargando...</div>}
            {!loading && !data && <div className="text-sm text-gray-500">No hay datos disponibles.</div>}

            {data && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase text-gray-400 mb-2">Score semanal</p>
                        <p className="text-4xl font-bold text-white">{data.score}</p>
                        <p className="text-xs text-gray-500 mt-1">Racha actual: {data.streak} dias</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Consistencia" value={data.components.consistencyScore} />
                        <MetricCard label="Ejecucion" value={data.components.executionScore} />
                        <MetricCard label="Recuperacion" value={data.components.recoveryScore} />
                        <MetricCard label="Foco" value={data.components.focusScore} />
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase text-gray-400 mb-2">Recomendaciones</p>
                        {data.recommendations.map((r, i) => (
                            <p key={i} className="text-sm text-gray-300 mb-2 last:mb-0">{r}</p>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isInfoOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsInfoOpen(false)}
                    >
                        <motion.div
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 16, opacity: 0 }}
                            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141414] p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase text-white">Que significa cada punto</h3>
                                <button onClick={() => setIsInfoOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {infoItems.map((item) => (
                                    <div key={item.title} className="rounded-lg border border-white/10 bg-white/5 p-3">
                                        <p className="text-xs font-bold text-white mb-1">{item.title}</p>
                                        <p className="text-xs text-gray-400">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MetricCard = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-[10px] uppercase text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
    </div>
);
