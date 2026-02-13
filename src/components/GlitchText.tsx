import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GlitchTextProps {
    text: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlitchText = ({ text, className, size = 'lg' }: GlitchTextProps) => {
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-6xl',
    };

    return (
        <motion.div
            className={cn("font-bold text-white relative inline-block", sizeClasses[size], className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <span className="relative z-10">{text}</span>
            <span className="absolute left-[2px] top-0 -z-10 text-accent-alert opacity-70 animate-pulse" aria-hidden="true">{text}</span>
            <span className="absolute -left-[2px] top-0 -z-10 text-accent-neon opacity-70 animate-pulse delay-75" aria-hidden="true">{text}</span>
        </motion.div>
    );
};
