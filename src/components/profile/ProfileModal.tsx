
import { motion } from 'framer-motion';
import { X, User, Save, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { useProtocolStore } from '../../store/useProtocolStore';
import { api } from '../../lib/api';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
    const { bioData, updateBioData, updateGymStats, recalculateTargets } = useProtocolStore();

    // Form State
    const [age, setAge] = useState(bioData.age);
    const [height, setHeight] = useState(bioData.height);
    const [weight, setWeight] = useState(bioData.weight);
    const [activity, setActivity] = useState(bioData.activity);
    const [avatarUrl, setAvatarUrl] = useState(bioData.avatar || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Upload the file
            const res = await api.upload('/upload/avatar', file);
            if (res.url) {
                setAvatarUrl(res.url);
            }
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            // Optional: Show error to user
        }
    };

    const handleSave = () => {
        // Update BioData (AI Nutritionist)
        updateBioData({
            age,
            height,
            weight,
            activity,
            avatar: avatarUrl
        });

        // Update GymStats (Training Legacy)
        updateGymStats({
            weight,
            height
        });

        // Recalculate Nutrition Targets based on new stats
        recalculateTargets();

        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm overflow-hidden rounded-2xl border p-6 relative shadow-2xl bg-neutral-900 border-white/10"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                        <User size={18} /> Perfil & Stats
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500">
                                    <User size={32} />
                                </div>
                            )}
                            <div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={handleAvatarClick}
                            >
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <div className="w-full">
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Avatar URL</label>
                            <input
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                                className="w-full bg-black/50 border p-2 text-xs text-white outline-none rounded border-white/10 focus:border-white/30"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Edad</label>
                            <input
                                type="number"
                                value={age}
                                onChange={e => setAge(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border p-2 text-center text-white outline-none rounded font-mono border-white/10 focus:border-white/30"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Peso (kg)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                                className="w-full bg-black/50 border p-2 text-center text-white outline-none rounded font-mono border-white/10 focus:border-white/30"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Altura (cm)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={e => setHeight(parseInt(e.target.value) || 0)}
                                className="w-full bg-black/50 border p-2 text-center text-white outline-none rounded font-mono border-white/10 focus:border-white/30"
                            />
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] text-gray-500 uppercase block">Nivel de Actividad</label>
                            <span className="font-mono font-bold text-white">{activity}x</span>
                        </div>
                        <input
                            type="range" min="1.2" max="1.9" step="0.1"
                            value={activity}
                            onChange={e => setActivity(parseFloat(e.target.value))}
                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                                [&::-webkit-slider-thumb]:bg-white
                            `}
                        />
                        <div className="flex justify-between text-[9px] text-gray-600 mt-2 uppercase tracking-wide">
                            <span>Sedentario</span>
                            <span>Atleta</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded transition-all mt-4 bg-white text-black hover:bg-gray-200"
                    >
                        <Save size={16} /> Guardar Cambios
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
