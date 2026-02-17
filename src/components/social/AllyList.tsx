
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Skull, Plus, AlertOctagon, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useProtocolStore } from '../../store/useProtocolStore';

interface Ally {
    id: string;
    name: string;
    img?: string;
    streak: number;
    status: 'ACTIVE' | 'BROKEN' | 'CRITICAL';
    lastActive: string; // ISO Date String
}

const mockAllies: Ally[] = [
    { id: '1', name: 'Jandro', streak: 45, status: 'ACTIVE', lastActive: new Date().toISOString() },
    { id: '2', name: 'Lucia', streak: 12, status: 'CRITICAL', lastActive: new Date().toISOString() }, // Critical = < 3 hours
    { id: '3', name: 'Marco', streak: 0, status: 'BROKEN', lastActive: new Date(Date.now() - 86400000).toISOString() },
    { id: '4', name: 'Sofi', streak: 8, status: 'ACTIVE', lastActive: new Date().toISOString() },
    { id: '5', name: 'Dani', streak: 0, status: 'BROKEN', lastActive: new Date(Date.now() - 86400000 * 2).toISOString() },
];

export const AllyList = () => {
    const { theme } = useProtocolStore();
    const isCyberpunk = theme === 'CYBERPUNK';

    const [allies] = useState<Ally[]>(mockAllies);
    const [nudgedIds, setNudgedIds] = useState<string[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const handleNudge = (id: string, name: string) => {
        if (nudgedIds.includes(id)) return;

        // Mock notification logic
        console.log(`Nudging ${name}: "¡No te mueras!"`);

        // Vibration feedback
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

        setNudgedIds(prev => [...prev, id]);

        // Temporary UI feedback (e.g. snackbar) could go here
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className={`text-xs font-bold uppercase tracking-widest ${isCyberpunk ? 'text-accent-neon' : 'text-gray-400'}`}>
                    Mis Aliados
                </h3>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                >
                    <UserPlus size={14} />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {allies.map((ally) => (
                    <AllyCard
                        key={ally.id}
                        ally={ally}
                        isCyberpunk={isCyberpunk}
                        isNudged={nudgedIds.includes(ally.id)}
                        onNudge={() => handleNudge(ally.id, ally.name)}
                    />
                ))}

                {/* Add Friend Card */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddOpen(true)}
                    className={`min-w-[70px] h-[90px] rounded-xl flex flex-col items-center justify-center border-2 border-dashed transition-colors snap-center
                        ${isCyberpunk ? 'border-gray-700 hover:border-accent-neon text-gray-600 hover:text-accent-neon' : 'border-gray-800 hover:border-gray-400 text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <Plus size={24} />
                    <span className="text-[10px] mt-2 font-bold uppercase">Invitar</span>
                </motion.button>
            </div>

            {/* Simple Add Friend Logic (UI only) */}
            <AnimatePresence>
                {isAddOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setIsAddOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-sm"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-white font-bold mb-4">Añadir Aliado</h3>
                            <input
                                autoFocus
                                placeholder="Username o Link..."
                                className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white mb-4 outline-none focus:border-accent-neon transition-colors"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddOpen(false)} className="flex-1 py-3 rounded-lg bg-white text-black font-bold uppercase text-xs">
                                    Enviar
                                </button>
                                <button onClick={() => setIsAddOpen(false)} className="flex-1 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white font-bold uppercase text-xs">
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AllyCard = ({ ally, isCyberpunk, onNudge, isNudged }: { ally: Ally, isCyberpunk: boolean, onNudge: () => void, isNudged: boolean }) => {

    // Status Logic
    const isBroken = ally.status === 'BROKEN';
    const isCritical = ally.status === 'CRITICAL';
    // const isActive = ally.status === 'ACTIVE'; // Unused

    // Visual Styles
    const borderColor = isBroken
        ? 'border-gray-700'
        : isCritical
            ? 'border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'
            : isCyberpunk ? 'border-orange-500 shadow-[0_0_10px_#f97316]' : 'border-orange-500';

    const statusProps = {
        ACTIVE: {
            icon: <Flame size={14} className="text-orange-500 fill-orange-500" />,
            label: ally.streak,
            bg: 'bg-orange-500/10',
            text: 'text-orange-500'
        },
        BROKEN: {
            icon: <Skull size={14} className="text-gray-400" />,
            label: 'RIP',
            bg: 'bg-gray-800/50',
            text: 'text-gray-400'
        },
        CRITICAL: {
            icon: <AlertOctagon size={14} className="text-red-500 animate-bounce" />, // Or fading flame
            label: '⏳',
            bg: 'bg-red-500/10',
            text: 'text-red-500'
        }
    };

    const currentStatus = statusProps[ally.status];

    return (
        <motion.div
            layout
            className="flex flex-col items-center gap-2 snap-center cursor-pointer group min-w-[70px]"
            onClick={() => {
                if (isBroken || isCritical) onNudge();
            }}
        >
            <div className={`relative w-14 h-14 rounded-full p-[2px] transition-all duration-500 ${borderColor} border-2 overflow-visible`}>
                {/* Avatar Placeholder */}
                <div className="w-full h-full rounded-full bg-neutral-800 overflow-hidden relative">
                    {ally.img ? (
                        <img src={ally.img} alt={ally.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">
                            {ally.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}

                    {/* Critical Overlay */}
                    {isCritical && (
                        <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                    )}

                    {/* Broken Overlay */}
                    {isBroken && (
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-grayscale" />
                    )}
                </div>

                {/* Status Badge */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold z-10 
                    ${isBroken ? 'bg-gray-700 text-white' : 'bg-neutral-900'}
                    ${isCritical ? 'animate-bounce bg-red-900 text-red-500' : ''}
                 `}>
                    {isBroken ? <Skull size={12} /> : currentStatus.icon}
                </div>
            </div>

            <div className="text-center">
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isBroken ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                    {ally.name}
                </p>

                {/* Streak Count / Status Text */}
                <div className={`text-[10px] font-mono leading-none py-0.5 px-1.5 rounded flex items-center justify-center gap-1 ${currentStatus.bg} ${currentStatus.text}`}>
                    {isNudged ? (
                        <span className="text-[8px] animate-pulse">SENT!</span>
                    ) : (
                        <>
                            {statusProps[ally.status].label}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
