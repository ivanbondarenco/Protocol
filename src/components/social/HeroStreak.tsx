import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { useProtocolStore } from '../../store/useProtocolStore';

export const HeroStreak = () => {
    const { getCurrentStreak } = useProtocolStore();
    const currentStreak = getCurrentStreak();

    return (
        <div className="relative w-full mb-6 p-6 rounded-2xl overflow-hidden border transition-all duration-300 border-neutral-800 bg-neutral-900">
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <Flame
                        size={48}
                        className="mb-2 drop-shadow-md text-orange-600"
                        fill="currentColor"
                    />
                    <h2 className="text-5xl font-black text-white tracking-tighter filter drop-shadow-lg">{currentStreak}</h2>
                    <p className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-4">Dias de racha</p>
                </motion.div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/20 px-3 py-2 rounded-full border border-white/5">
                    <Sparkles size={12} className="text-yellow-500" />
                    <span>
                        Racha automatica: se mantiene cuando completas todos los habitos del dia.
                    </span>
                </div>
            </div>
        </div>
    );
};
