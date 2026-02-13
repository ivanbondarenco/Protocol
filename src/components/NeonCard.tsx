import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface NeonCardProps {
    children: ReactNode;
    className?: string;
    glowColor?: string;
    onClick?: () => void;
}

export const NeonCard = ({ children, className, glowColor = 'rgba(0, 242, 255, 0.15)', onClick }: NeonCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, boxShadow: `0 0 20px ${glowColor}` }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={cn(
                "bg-carbonblack border border-white/10 p-6 relative overflow-hidden transition-all duration-300 cursor-pointer",
                className
            )}
        >
            {children}
        </motion.div>
    );
};
