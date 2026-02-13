import { Check, Trash2 } from 'lucide-react';


interface ProtocolToggleProps {
    id: string;
    title: string;
    completed: boolean;
    onToggle: (id: string) => void;
    onDelete?: (id: string) => void;
}

export const ProtocolToggle = ({ id, title, completed, onToggle, onDelete }: ProtocolToggleProps) => {
    return (
        <div className="group relative flex items-center justify-between bg-carbonblack border border-white/5 p-4 cursor-pointer hover:border-accent-neon/30 transition-colors">
            <div className="flex items-center gap-4 flex-1" onClick={() => onToggle(id)}>
                <div
                    className={`w-5 h-5 border flex items-center justify-center transition-all duration-300
          ${completed ? 'bg-accent-neon border-accent-neon text-black shadow-[0_0_10px_#00f2ff]' : 'border-white/20'}`}
                >
                    {completed && <Check size={14} strokeWidth={4} />}
                </div>
                <span className={`text-sm uppercase tracking-widest transition-colors ${completed ? 'text-white line-through decoration-accent-neon/50' : 'text-gray-400'}`}>
                    {title}
                </span>
            </div>

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-600 hover:text-accent-alert"
                >
                    <Trash2 size={16} />
                </button>
            )}

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,242,255,0.02)_50%,transparent_100%)] pointer-events-none opacity-0 group-hover:opacity-100" />
        </div>
    );
};
