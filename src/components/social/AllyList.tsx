import { motion, AnimatePresence } from 'framer-motion';
import { Plus, UserPlus, X, Search, Bell, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { getRealtimeSocket } from '../../services/realtimeService';

interface SearchUser {
    id: string;
    username: string;
    name?: string;
    email: string;
    avatarUrl?: string;
    streak: number;
}

interface Invite {
    id: string;
    fromUser: { id: string; username: string };
}

interface Ping {
    id: string;
    message: string;
    seen: boolean;
    createdAt: string;
    fromUser: { id: string; username: string };
}

interface AllyTracker {
    id: string;
    username: string;
    name?: string;
    email: string;
    avatarUrl?: string;
    accountStartDate?: string;
    activity: number[];
}

export const AllyList = ({ view = 'trackers' }: { view?: 'summary' | 'trackers' }) => {
    const [trackers, setTrackers] = useState<AllyTracker[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchUser[]>([]);
    const [selected, setSelected] = useState<SearchUser | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [pings, setPings] = useState<Ping[]>([]);
    const [liveMessage, setLiveMessage] = useState<string | null>(null);

    const hasAllies = trackers.length > 0;
    const unreadPingItems = pings.filter((p) => !p.seen);
    const unreadPings = unreadPingItems.length;
    const canSubmit = useMemo(() => !!selected, [selected]);

    const loadSocial = async () => {
        try {
            const [trackerRes, inviteRes, pingRes] = await Promise.all([
                api.get('/social/allies/trackers'),
                api.get('/social/invites'),
                api.get('/social/pings')
            ]);
            setTrackers(trackerRes.trackers || []);
            setInvites(inviteRes.invitations || []);
            setPings(pingRes.pings || []);
        } catch (e) {
            console.error('Load social failed', e);
            setTrackers([]);
        }
    };

    useEffect(() => {
        loadSocial();
    }, []);

    useEffect(() => {
        const socket = getRealtimeSocket();
        if (!socket) return;

        const refresh = (message: string) => {
            setLiveMessage(message);
            loadSocial();
            setTimeout(() => setLiveMessage(null), 2200);
        };

        const onInvite = () => refresh('Nueva invitacion recibida');
        const onPing = () => refresh('Nuevo ping recibido');
        const onInviteAccepted = () => refresh('Tu invitacion fue aceptada');
        const onSpark = () => refresh('Nueva chispa publicada');

        socket.on('social:invite_received', onInvite);
        socket.on('social:ping_received', onPing);
        socket.on('social:invite_accepted', onInviteAccepted);
        socket.on('social:spark_published', onSpark);

        return () => {
            socket.off('social:invite_received', onInvite);
            socket.off('social:ping_received', onPing);
            socket.off('social:invite_accepted', onInviteAccepted);
            socket.off('social:spark_published', onSpark);
        };
    }, []);

    useEffect(() => {
        const timeout = setTimeout(async () => {
            const clean = query.trim();
            if (clean.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const response = await api.get(`/social/search-users?q=${encodeURIComponent(clean)}`);
                setResults(response.users || []);
            } catch (e) {
                console.error('Search users failed', e);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 250);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleAdd = async () => {
        if (!selected) return;
        try {
            await api.post('/social/invites', { toUserId: selected.id });
            setIsAddOpen(false);
            setQuery('');
            setResults([]);
            setSelected(null);
            await loadSocial();
        } catch (e) {
            console.error('Send invite failed', e);
        }
    };

    const handleInviteResponse = async (invitationId: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            await api.post('/social/invites/respond', { invitationId, action });
            await loadSocial();
        } catch (e) {
            console.error('Respond invite failed', e);
        }
    };

    const handleSendPing = async (toUserId: string) => {
        try {
            await api.post('/social/pings', { toUserId, message: 'No aflojes, completa tus habitos hoy.' });
            setLiveMessage('Ping enviado');
            setTimeout(() => setLiveMessage(null), 1200);
        } catch (e) {
            console.error('Ping send failed', e);
        }
    };

    const handleMarkPingsSeen = async () => {
        try {
            await api.post('/social/pings/seen', {});
            setPings((prev) => prev.map((p) => ({ ...p, seen: true })));
        } catch (e) {
            console.error('Mark pings seen failed', e);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Mis Aliados</h3>
                <button onClick={() => setIsAddOpen(true)} className="p-1 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white">
                    <UserPlus size={14} />
                </button>
            </div>

            {liveMessage && (
                <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-gray-300">
                    {liveMessage}
                </div>
            )}

            {view === 'trackers' && !hasAllies && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400">
                    No tienes aliados todavia. Agrega usuarios por username, email o nombre.
                </div>
            )}

            {view === 'trackers' && hasAllies && (
                <div className="space-y-3">
                    {trackers.map((ally) => (
                        <AllyTrackerCard key={ally.id} ally={ally} onPing={() => handleSendPing(ally.id)} />
                    ))}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsAddOpen(true)}
                        className="w-full h-[48px] rounded-xl flex items-center justify-center border-2 border-dashed transition-colors border-gray-800 hover:border-gray-400 text-gray-500 hover:text-gray-300 gap-2"
                    >
                        <Plus size={18} />
                        <span className="text-[10px] font-bold uppercase">Invitar Aliado</span>
                    </motion.button>
                </div>
            )}

            {unreadPings > 0 && (
                <div className="mb-3 mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white font-bold uppercase flex items-center gap-1">
                            <Bell size={12} /> Pings ({unreadPings})
                        </p>
                        <button onClick={handleMarkPingsSeen} className="text-[10px] px-2 py-1 border border-white/20 rounded text-gray-300">
                            Marcar leidos
                        </button>
                    </div>
                    {unreadPingItems.slice(0, 3).map((p) => (
                        <div key={p.id} className="text-[11px] mb-1 last:mb-0 text-gray-300">
                            <span className="text-white">{p.fromUser.username}:</span> {p.message}
                        </div>
                    ))}
                </div>
            )}

            {invites.length > 0 && (
                <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-white font-bold uppercase mb-2">Invitaciones pendientes</p>
                    {invites.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between mb-2 last:mb-0">
                            <span className="text-xs text-gray-300">{inv.fromUser.username}</span>
                            <div className="flex gap-1">
                                <button onClick={() => handleInviteResponse(inv.id, 'ACCEPT')} className="px-2 py-1 text-[10px] bg-white text-black rounded">Aceptar</button>
                                <button onClick={() => handleInviteResponse(inv.id, 'REJECT')} className="px-2 py-1 text-[10px] border border-white/20 text-gray-400 rounded">Rechazar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold">Anadir Aliado</h3>
                                <button onClick={() => setIsAddOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
                            </div>

                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-3 text-gray-500" size={16} />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                                    placeholder="Username, email o nombre..."
                                    className="w-full bg-black/50 border border-white/10 p-3 pl-9 rounded-lg text-white outline-none focus:border-white/40 transition-colors"
                                />
                            </div>

                            {isSearching && <p className="text-[11px] text-gray-500 mb-2">Buscando...</p>}
                            {results.length > 0 && (
                                <div className="mb-4 max-h-44 overflow-y-auto border border-white/10 rounded-lg">
                                    {results.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelected(item)}
                                            className={`w-full px-3 py-2 text-left border-b last:border-b-0 border-white/10 hover:bg-white/5 ${selected?.id === item.id ? 'bg-white/10' : ''}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-white">{item.username}</p>
                                                <span className="text-[10px] font-mono text-gray-500">{item.streak > 0 ? `${item.streak} dias` : 'NUEVO'}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500">{item.name || item.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={handleAdd} disabled={!canSubmit} className="flex-1 py-3 rounded-lg bg-white text-black font-bold uppercase text-xs disabled:opacity-50">
                                    Solicitar
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

const resolveActivityTone = (level: number) => {
    if (level >= 4) return 'bg-[#4dd06a]';
    if (level === 3) return 'bg-[#35a153]';
    if (level === 2) return 'bg-[#2a6b3d]';
    if (level === 1) return 'bg-[#1f4028]';
    return 'bg-[#2f3338]';
};

const AllyTrackerCard = ({ ally, onPing }: { ally: AllyTracker; onPing: () => void }) => {
    const TOTAL_SLOTS = 70;
    const normalized = Array.from({ length: TOTAL_SLOTS }).map((_, index) => ally.activity[index] ?? 0);
    const weeks = Array.from({ length: 10 }).map((_, weekIndex) =>
        normalized.slice(weekIndex * 7, weekIndex * 7 + 7)
    );
    const formattedStart = ally.accountStartDate
        ? new Date(`${ally.accountStartDate}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })
        : null;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {ally.avatarUrl ? (
                        <img src={ally.avatarUrl} alt={ally.username} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                    ) : (
                        <div className="w-10 h-10 rounded-full border border-white/20 bg-neutral-800 flex items-center justify-center text-xs text-gray-300 font-bold">
                            {ally.username.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="text-sm text-white font-semibold leading-none">{ally.username}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{ally.name || ally.email}</p>
                    </div>
                </div>
                <button onClick={onPing} className="px-2 py-1 border border-white/20 rounded text-[10px] text-gray-300 hover:text-white flex items-center gap-1">
                    <Send size={11} /> Ping
                </button>
            </div>

            <div className="w-full">
                <div className="grid w-full grid-cols-10 gap-[3px]">
                    {weeks.map((week, weekIndex) => (
                        <div key={`${ally.id}-w-${weekIndex}`} className="grid grid-rows-7 gap-[3px]">
                            {week.map((level, dayIndex) => (
                                <div
                                    key={`${ally.id}-${weekIndex}-${dayIndex}`}
                                    className={`aspect-square w-full rounded-[2px] border border-black/10 ${resolveActivityTone(level)}`}
                                    title={`${ally.username} // nivel ${level}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-gray-500">
                <span>{formattedStart ? `Inicio ${formattedStart}` : 'Inicio'}</span>
                <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[#2f3338]" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[#1f4028]" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[#2a6b3d]" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[#35a153]" />
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[#4dd06a]" />
                </div>
                <span>10 semanas</span>
            </div>
        </div>
    );
};
