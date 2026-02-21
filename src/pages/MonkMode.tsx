import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';


interface MonkModeProps {
    onUnlock?: () => void;
    isLocked?: boolean;
}

export const MonkMode = ({ onUnlock, isLocked = false }: MonkModeProps) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.toUpperCase() === 'I ACCEPT RESPONSIBILITY') {
            if (onUnlock) onUnlock();
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
        }
    };

    return (
        <div className="min-h-screen bg-bg-void flex flex-col items-center justify-center px-6 text-center relative z-[100]">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
                className="mb-8 w-full max-w-md"
            >
                <Lock size={64} className="text-red-400 mx-auto mb-6 animate-pulse" />
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tighter">MONK MODE <br /><span className="text-red-400">ENGAGED</span></h1>

                {isLocked ? (
                    <>
                        <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed mb-8">
                            Protocol failure detected. Access denied.
                            <br />
                            acknowledge your failure to proceed.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="I ACCEPT RESPONSIBILITY"
                                className={`w-full bg-carbonblack border ${error ? 'border-red-500' : 'border-white/10'} p-3 rounded text-center text-white placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors uppercase`}
                            />
                            <button
                                type="submit"
                                className="w-full bg-white/5 border border-white/10 text-gray-400 py-3 rounded hover:bg-white/10 hover:text-white transition-all uppercase font-bold text-xs tracking-wider"
                            >
                                Unlock Protocol
                            </button>
                        </form>
                    </>
                ) : (
                    <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                        Distractions are currently disabled.
                        Return to your protocol immediately.
                    </p>
                )}
            </motion.div>

            <div className="w-full max-w-xs h-0.5 bg-white/10 relative overflow-hidden">
                <motion.div
                    className="h-full bg-red-500"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
            </div>
        </div>
    );
};
