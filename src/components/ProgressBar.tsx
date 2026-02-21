import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar = ({ progress, className }: ProgressBarProps) => {
    const safeProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={cn("w-full h-2.5 bg-white/10 relative overflow-hidden rounded-full", className)}>
            <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${safeProgress}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
            />
        </div>
    );
};
