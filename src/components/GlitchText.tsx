import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GlitchTextProps {
    text: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlitchText = ({ text, className, size = 'lg' }: GlitchTextProps) => {
    const sizeClasses = {
        sm: 'text-lg tracking-tight',
        md: 'text-2xl tracking-tight',
        lg: 'text-[2rem] tracking-tight',
        xl: 'text-[3rem] tracking-tight',
    };

    return (
        <motion.div
            className={cn("font-extrabold text-white relative inline-block", sizeClasses[size], className)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
        >
            <span className="relative z-10">{text}</span>
            <span className="absolute left-0 -bottom-1 h-[2px] w-10 rounded bg-white/35" aria-hidden="true" />
        </motion.div>
    );
};
