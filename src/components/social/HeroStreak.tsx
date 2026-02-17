
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';
import { useProtocolStore } from '../../store/useProtocolStore';
import { useMemo } from 'react';

export const HeroStreak = () => {
    const { history, theme } = useProtocolStore();

    // Simple streak calculation (mock or real logic based on history keys)
    const currentStreak = useMemo(() => {
        // This is a placeholder logic. You might need a more robust streak calculator 
        // that checks consecutive days in `history`.
        // For now, let's pretend it's calculated or mock it.
        // In a real app, this would iterate backwards from today.
        let streak = 0;
        // Mocking for UI demonstration
        const today = new Date().toISOString().split('T')[0];
        if (history[today]) streak = 1;
        streak += Object.keys(history).length; // simplistic
        return streak > 0 ? streak : 12; // Force a number for design demo
    }, [history]);

    const topFriend = "AlexT"; // Mock
    const daysToBeat = 2; // Mock

    // Theme adaptations
    const isCyberpunk = theme === 'CYBERPUNK';

    return (
        <div className={`relative w-full mb-6 p-6 rounded-2xl overflow-hidden border transition-all duration-300
            ${isCyberpunk ? 'border-orange-500/30 bg-orange-900/10 shadow-[0_0_20px_rgba(255,69,0,0.2)]' : 'border-neutral-800 bg-neutral-900'}
        `}>
            {/* Ambient Background Glow for Cyberpunk */}
            {isCyberpunk && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/20 blur-[60px] rounded-full pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative">
                        <Flame
                            size={48}
                            className={`mb-2 drop-shadow-md ${isCyberpunk ? 'text-orange-500 shadow-orange-500' : 'text-orange-600'}`}
                            fill={isCyberpunk ? "#FF4500" : "currentColor"}
                        />
                        {/* Animated overlay for fire effect */}
                        {isCyberpunk && (
                            <motion.div
                                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 text-yellow-500 mix-blend-screen pointer-events-none"
                            >
                                <Flame size={48} fill="#FFD700" />
                            </motion.div>
                        )}
                    </div>

                    <h2 className="text-5xl font-black text-white tracking-tighter filter drop-shadow-lg">
                        {currentStreak}
                    </h2>
                    <p className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-4">
                        Días de Racha
                    </p>
                </motion.div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                    <Trophy size={12} className="text-yellow-500" />
                    <span>Estás a <span className="text-white font-bold">{daysToBeat} días</span> de superar a <span className="text-white font-bold">{topFriend}</span></span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg transition-all
                        ${isCyberpunk
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-orange-900/40 border border-orange-500/50'
                            : 'bg-white text-black hover:bg-gray-200'}
                    `}
                >
                    Mantener Racha 🔥
                </motion.button>
            </div>
        </div>
    );
};
