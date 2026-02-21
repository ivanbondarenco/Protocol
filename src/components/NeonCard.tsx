import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface NeonCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const NeonCard = ({ children, className, onClick }: NeonCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.995 }}
            onClick={onClick}
            className={cn(
                "bg-[#171719]/95 border border-white/10 rounded-2xl p-5 relative overflow-hidden transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
                onClick ? "cursor-pointer hover:border-white/20" : "",
                className
            )}
        >
            {children}
        </motion.div>
    );
};
