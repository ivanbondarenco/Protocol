import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { APP_TRANSLATIONS } from '../data/translations';
import { useProtocolStore } from '../store/useProtocolStore';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const userLogin = useAuthStore(state => state.login);
    const { language, setLanguage } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];

    useEffect(() => {
        document.body.className = '';
        document.body.classList.add('minimal-dark');
    }, []);

    const handleAlphaInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        setter(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isRegister) {
            if (!name || !email || !password) {
                setError(t.PLEASE_FILL_FIELDS);
                return;
            }
        }

        setLoading(true);

        const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:4000/api';
        const endpoint = isRegister
            ? `${BASE_URL}/auth/register`
            : `${BASE_URL}/auth/login`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name: isRegister ? name : undefined }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Authentication Failed');
            }

            userLogin(data.token, data.user);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-5">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="rounded-[28px] bg-[#131313] border border-white/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                    <div className="mb-4 flex justify-end">
                        <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setLanguage('EN')}
                                className={`px-3 py-1.5 text-xs transition-colors ${language === 'EN' ? 'bg-white text-black' : 'bg-transparent text-gray-400 hover:text-white'}`}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => setLanguage('ES')}
                                className={`px-3 py-1.5 text-xs transition-colors ${language === 'ES' ? 'bg-white text-black' : 'bg-transparent text-gray-400 hover:text-white'}`}
                            >
                                Espanol
                            </button>
                        </div>
                    </div>

                    <div className="mb-7">
                        <div className="flex items-center gap-3 mb-6">
                            <img src="/protocol-icon.svg" alt="Protocol" className="w-12 h-12 shadow-md rounded-[12px] overflow-hidden" />
                            <p className="text-[12px] font-bold tracking-[0.25em] uppercase text-gray-400 m-0 leading-none">Protocol</p>
                        </div>
                        <h1 className="text-white text-[28px] leading-tight font-semibold tracking-tight">
                            {isRegister ? t.CREATE_ACCOUNT_TITLE : t.WELCOME_BACK_TITLE}
                        </h1>
                        <p className="text-gray-400 text-sm mt-2">
                            {isRegister ? t.CREATE_IDENTITY : t.ACCESS_RESTRICTED}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="bg-red-500/10 border border-red-500/40 p-3 rounded-xl flex items-center gap-2 text-red-300 text-xs"
                                >
                                    <AlertTriangle size={14} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isRegister && (
                            <input
                                type="text"
                                placeholder={t.REGISTER_NAME_PH}
                                className="w-full h-12 rounded-xl px-4 bg-[#0e0e0e] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 mb-3"
                                value={name}
                                onChange={e => handleAlphaInput(e, setName)}
                            />
                        )}

                        <input
                            type="email"
                            placeholder={t.USER_EMAIL}
                            className="w-full h-12 rounded-xl px-4 bg-[#0e0e0e] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder={t.PASSWORD_PLACEHOLDER}
                            className="w-full h-12 rounded-xl px-4 bg-[#0e0e0e] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ y: -1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                            className="relative overflow-hidden w-full h-12 rounded-xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <motion.span
                                aria-hidden="true"
                                initial={{ x: '-130%' }}
                                whileTap={{ x: '130%' }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-black/15 to-transparent"
                            />
                            {loading ? t.CONNECTING : (
                                <>
                                    {isRegister ? t.CREATE_ACCOUNT_BTN : t.SIGN_IN_BTN} <ArrowRight size={16} />
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => { setError(null); setIsRegister(!isRegister); }}
                        className="text-gray-500 text-xs hover:text-white transition-colors"
                    >
                        {isRegister ? t.ALREADY_HAVE_ACCOUNT : t.NEW_HERE}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

