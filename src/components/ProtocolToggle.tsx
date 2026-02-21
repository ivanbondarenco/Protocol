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
        <div className="group relative flex items-center justify-between bg-[#18181b] border border-white/10 p-4 rounded-xl cursor-pointer hover:border-white/25 transition-colors">
            <div className="flex items-center gap-4 flex-1" onClick={() => onToggle(id)}>
                <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${completed ? 'bg-white border-white text-black' : 'border-white/25 bg-black/20'}`}
                >
                    {completed && <Check size={14} strokeWidth={4} />}
                </div>
                <span className={`text-sm uppercase tracking-[0.08em] transition-colors ${completed ? 'text-white line-through decoration-white/40' : 'text-gray-300'}`}>
                    {title}
                </span>
            </div>

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-600 hover:text-red-300"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
};
