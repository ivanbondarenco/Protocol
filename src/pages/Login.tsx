import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { GlitchText } from '../components/GlitchText';
import { NeonCard } from '../components/NeonCard';
import { User, Lock, ArrowRight, Mail, AlertTriangle } from 'lucide-react';
import { APP_TRANSLATIONS } from '../data/translations';
import { useProtocolStore } from '../store/useProtocolStore';
import { useEffect } from 'react';

export const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Auth Store
    const userLogin = useAuthStore(state => state.login);
    const { language, theme } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];

    useEffect(() => {
        // Apply Theme to body just like App.tsx
        document.body.className = '';
        if (theme === 'MINIMAL_DARK') document.body.classList.add('minimal-dark');
        if (theme === 'MINIMAL_HOLISTIC') document.body.classList.add('minimal-holistic');
    }, [theme]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const endpoint = isRegister
            ? 'http://localhost:4000/api/auth/register'
            : 'http://localhost:4000/api/auth/login';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name: isRegister ? name : undefined }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Authentication Failed');
            }

            // Success
            userLogin(data.token, data.user);
            window.location.href = '/';

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-voidblack flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.1),rgba(0,0,0,0))]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm z-10"
            >
                <div className="mb-8 text-center">
                    <GlitchText text={isRegister ? t.INIT_PROTOCOL : t.SYSTEM_LOGIN} className="text-3xl justify-center mb-2" />
                    <p className="text-gray-400 text-xs tracking-[0.2em] uppercase">
                        {isRegister ? t.CREATE_IDENTITY : t.ACCESS_RESTRICTED}
                    </p>
                </div>

                <NeonCard>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <AnimatePresence mode='wait'>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-red-900/20 border border-red-500/50 p-3 rounded flex items-center gap-2 text-red-400 text-xs"
                                >
                                    <AlertTriangle size={16} />
                                    {error.toUpperCase()}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-accent-neon transition-colors" size={18} />
                                <input
                                    type="email"
                                    placeholder={t.USER_EMAIL}
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 pl-10 text-white placeholder-gray-600 focus:border-accent-neon focus:outline-none transition-colors font-mono text-sm"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {isRegister && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                            >
                                <div className="relative group mb-4">
                                    <User className="absolute left-3 top-3 text-gray-500 group-focus-within:text-accent-neon transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="CODENAME"
                                        className="w-full bg-black/50 border border-white/10 rounded p-3 pl-10 text-white placeholder-gray-600 focus:border-accent-neon focus:outline-none transition-colors font-mono text-sm"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-accent-neon transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="ACCESS_KEY"
                                    className="w-full bg-black/50 border border-white/10 rounded p-3 pl-10 text-white placeholder-gray-600 focus:border-accent-neon focus:outline-none transition-colors font-mono text-sm"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-neon text-black font-bold py-3 uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">CONNECTING...</span>
                            ) : (
                                <>
                                    {isRegister ? t.INITIALIZE : t.AUTHENTICATE} <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </NeonCard>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setError(null); setIsRegister(!isRegister); }}
                        className="text-gray-500 text-xs hover:text-white transition-colors uppercase tracking-wider flex items-center justify-center gap-2 mx-auto"
                    >
                        {isRegister ? (
                            <> {t.ALREADY_ACCESS} <span className="text-accent-neon">{t.LOGIN}</span></>
                        ) : (
                            <> {t.NEW_USER} <span className="text-accent-neon">{t.REGISTER}</span></>
                        )}
                    </button>
                </div>

            </motion.div>

            <div className="absolute bottom-4 text-[10px] text-gray-700 font-mono">
                {t.SECURE_CONNECTION}
            </div>
        </div>
    );
};
