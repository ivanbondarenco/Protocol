import { GlitchText } from '../components/GlitchText';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const Pomodoro = () => {
    // Lazy Init State
    const [timeLeft, setTimeLeft] = useState(() => {
        const savedTarget = localStorage.getItem('pomodoroTarget');
        const savedMode = localStorage.getItem('pomodoroMode');
        if (savedTarget && savedMode) {
            const targetTime = parseInt(savedTarget, 10);
            const now = Date.now();
            if (targetTime > now) return Math.ceil((targetTime - now) / 1000);
        }
        return 25 * 60;
    });

    const [isActive, setIsActive] = useState(() => {
        const savedTarget = localStorage.getItem('pomodoroTarget');
        return !!savedTarget && parseInt(savedTarget, 10) > Date.now();
    });

    const [mode, setMode] = useState<'FOCUS' | 'REST'>(() => {
        const savedTarget = localStorage.getItem('pomodoroTarget');
        const savedMode = (localStorage.getItem('pomodoroMode') as 'FOCUS' | 'REST') || 'FOCUS';

        if (savedTarget && parseInt(savedTarget, 10) <= Date.now()) {
            // Expired while away -> Flip Mode
            return savedMode === 'FOCUS' ? 'REST' : 'FOCUS';
        }
        return savedMode;
    });

    // Wake Lock Ref
    const wakeLock = useRef<any>(null);

    // Effect to handle expiration while away (cleanup only)
    useEffect(() => {
        const savedTarget = localStorage.getItem('pomodoroTarget');
        if (savedTarget && parseInt(savedTarget, 10) <= Date.now()) {
            localStorage.removeItem('pomodoroTarget');
            // State is already set correctly by lazy init
        }
    }, []);

    // Request Wake Lock
    useEffect(() => {
        const requestWakeLock = async () => {
            if (isActive && 'wakeLock' in navigator) {
                try {
                    wakeLock.current = await (navigator as any).wakeLock.request('screen');
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        };

        const releaseWakeLock = () => {
            if (wakeLock.current) {
                wakeLock.current.release();
                wakeLock.current = null;
            }
        };

        if (isActive) requestWakeLock();
        else releaseWakeLock();

        return () => releaseWakeLock();
    }, [isActive]);


    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isActive) {
            interval = setInterval(() => {
                setTimeLeft((time) => {
                    const newTime = time - 1;
                    if (newTime <= 0) {
                        clearInterval(interval);
                        setIsActive(false);
                        localStorage.removeItem('pomodoroTarget');
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive]);

    const toggleTimer = () => {
        if (!isActive) {
            // Start: Set target time in storage
            const targetTime = Date.now() + (timeLeft * 1000);
            localStorage.setItem('pomodoroTarget', targetTime.toString());
            localStorage.setItem('pomodoroMode', mode);
            setIsActive(true);
        } else {
            // Pause: Clear storage
            localStorage.removeItem('pomodoroTarget');
            setIsActive(false);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        localStorage.removeItem('pomodoroTarget');
        setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
    };

    const switchMode = () => {
        const newMode = mode === 'FOCUS' ? 'REST' : 'FOCUS';
        setMode(newMode);
        localStorage.removeItem('pomodoroTarget');
        setTimeLeft(newMode === 'FOCUS' ? 25 * 60 : 5 * 60);
        setIsActive(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="min-h-screen bg-voidblack flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Pulse */}
            {isActive && (
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-white rounded-full blur-[100px] opacity-10 pointer-events-none"
                />
            )}

            <GlitchText text="DEEP WORK" size="md" className="mb-12 z-10" />

            <div className="relative z-10 text-center">
                <motion.div
                    key={mode}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-[120px] font-mono font-bold leading-none text-white tracking-tighter"
                >
                    {formatTime(timeLeft)}
                </motion.div>

                <div className="mt-4 text-white font-bold tracking-[0.5em] text-sm uppercase">
                    {mode} MODE
                </div>
            </div>

            <div className="mt-16 flex gap-8 z-10">
                <button onClick={switchMode} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white transition-all">
                    <RefreshCw size={20} />
                </button>

                <button
                    onClick={toggleTimer}
                    className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center shadow-[0_10px_26px_rgba(0,0,0,0.35)] hover:scale-105 transition-transform"
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button onClick={resetTimer} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white transition-all">
                    <span className="text-xs font-bold">RST</span>
                </button>
            </div>
        </div>
    );
};
