import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProtocolStore } from '../../store/useProtocolStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';

const OBJECTIVES = ['Mental', 'Espiritual', 'Fisico', 'Financiero', 'Social'];
const ACTIVITIES = [
    { label: 'Baja', value: 1.2 },
    { label: 'Moderada', value: 1.45 },
    { label: 'Alta', value: 1.7 }
];

type StepId = 'welcome' | 'age' | 'weight' | 'height' | 'activity' | 'objectives' | 'username';

export const OnboardingFlow = () => {
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);
    const authLogin = useAuthStore(state => state.login);
    const { updateBioData, recalculateTargets, completeOnboarding, setTheme, syncHabits } = useProtocolStore();

    const [step, setStep] = useState<StepId>('welcome');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [activity, setActivity] = useState(1.2);
    const [objectives, setObjectives] = useState<string[]>([]);
    const [username, setUsername] = useState('');

    const needsPhysical = objectives.map(o => o.toLowerCase()).includes('fisico');
    const order: StepId[] = needsPhysical
        ? ['welcome', 'objectives', 'age', 'weight', 'height', 'activity', 'username']
        : ['welcome', 'objectives', 'age', 'username'];
    const index = order.indexOf(step);
    const progress = useMemo(() => ((index + 1) / order.length) * 100, [index, order.length]);

    const next = async () => {
        if (index === order.length - 1) {
            if (!user?.id) return;
            const trimmedUsername = username.trim();
            updateBioData({
                age: Math.max(10, parseInt(age || '0', 10)),
                weight: Math.max(30, parseFloat(weight || '0')),
                height: Math.max(120, parseFloat(height || '0')),
                activity,
                objectives,
                username: trimmedUsername
            });
            if (trimmedUsername) {
                try {
                    const response = await api.put('/auth/me', { username: trimmedUsername, name: user.name });
                    if (response?.user && token) {
                        authLogin(token, response.user);
                    }
                } catch (e) {
                    console.error('Could not persist username', e);
                }
            }

            try {
                await api.post('/onboarding/complete', {
                    objectives,
                    age: Math.max(10, parseInt(age || '0', 10)),
                    weight: Math.max(30, parseFloat(weight || '0')),
                    height: Math.max(120, parseFloat(height || '0')),
                    activity,
                    username: trimmedUsername
                });
                await syncHabits();
            } catch (e) {
                console.error('Onboarding backend completion failed', e);
            }

            recalculateTargets();
            setTheme('MINIMAL_DARK');
            completeOnboarding(user.id);
            return;
        }
        setStep(order[index + 1]);
    };

    const back = () => {
        if (index <= 0) return;
        setStep(order[index - 1]);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-[#151515] border border-white/10 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.55)] p-6">
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22 }}
                        className="min-h-[280px] flex flex-col justify-between"
                    >
                        {step === 'welcome' && (
                            <div>
                                <h1 className="text-[28px] leading-tight font-semibold tracking-tight mb-4">
                                    Bienvenido a Protocol, tu journal definitivo.
                                </h1>
                                <p className="text-gray-400 text-sm">Configuramos tu perfil en menos de 1 minuto.</p>
                            </div>
                        )}

                        {step === 'age' && (
                            <StepInput title="Elegir edad" value={age} onChange={setAge} type="number" placeholder="Ingrese tu edad" />
                        )}

                        {step === 'weight' && (
                            <StepInput title="Elegir peso" value={weight} onChange={setWeight} type="number" placeholder="Ingrese tu peso" />
                        )}

                        {step === 'height' && (
                            <StepInput title="Elegir estatura" value={height} onChange={setHeight} type="number" placeholder="Ingrese tu estatura" />
                        )}

                        {step === 'activity' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Nivel de actividad</h2>
                                <div className="space-y-2">
                                    {ACTIVITIES.map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => setActivity(item.value)}
                                            className={`w-full py-3 rounded-2xl border text-sm transition-colors ${activity === item.value ? 'bg-white text-black border-white' : 'bg-[#101010] text-white border-white/15 hover:border-white/30'}`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 'objectives' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Objetivos</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {OBJECTIVES.map(item => {
                                        const active = objectives.includes(item);
                                        return (
                                            <button
                                                key={item}
                                                onClick={() => {
                                                    setObjectives(prev =>
                                                        prev.includes(item) ? prev.filter(o => o !== item) : [...prev, item]
                                                    );
                                                }}
                                                className={`py-3 rounded-2xl text-sm border transition-colors ${active ? 'bg-white text-black border-white' : 'bg-[#101010] text-white border-white/15 hover:border-white/30'}`}
                                            >
                                                {item}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {step === 'username' && (
                            <StepInput
                                title="Elegir nombre de usuario"
                                value={username}
                                onChange={setUsername}
                                type="text"
                                placeholder="Ingrese tu nombre de usuario"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex gap-2">
                    <button
                        onClick={back}
                        disabled={index === 0}
                        className="flex-1 py-3 rounded-2xl border border-white/15 text-gray-400 disabled:opacity-40"
                    >
                        Atras
                    </button>
                    <motion.button
                        onClick={next}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ y: -1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className="relative overflow-hidden flex-1 py-3 rounded-2xl bg-white text-black font-semibold shadow-[0_8px_26px_rgba(255,255,255,0.15)]"
                    >
                        <motion.span
                            aria-hidden="true"
                            initial={{ x: '-130%' }}
                            whileTap={{ x: '130%' }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-black/15 to-transparent"
                        />
                        Continuar
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

const StepInput = ({
    title,
    value,
    onChange,
    type,
    placeholder
}: {
    title: string;
    value: string;
    onChange: (next: string) => void;
    type: string;
    placeholder?: string;
}) => (
    <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="relative">
            <input
                autoFocus
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full py-4 px-4 rounded-2xl bg-[#101010] border border-white/15 outline-none focus:border-white/35 text-lg text-white placeholder:text-gray-500"
            />
        </div>
    </div>
);
