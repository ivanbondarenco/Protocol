import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar = ({ progress, className }: ProgressBarProps) => {
    const safeProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={cn("w-full h-2 bg-white/10 relative overflow-hidden rounded-none", className)}>
            <motion.div
                className="h-full bg-accent-neon shadow-[0_0_10px_#00f2ff]"
                initial={{ width: 0 }}
                animate={{ width: `${safeProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
        </div>
    );
};
