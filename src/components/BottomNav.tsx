import { LayoutDashboard, Dumbbell, Utensils, Brain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useProtocolStore } from '../store/useProtocolStore';
import { APP_TRANSLATIONS } from '../data/translations';

export const BottomNav = () => {
    const location = useLocation();
    const { language } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];

    const navItems = [
        { icon: LayoutDashboard, label: t.NAV_DASHBOARD, path: '/' },
        { icon: Dumbbell, label: t.NAV_TRAINING, path: '/training' },
        { icon: Utensils, label: t.NAV_FUEL, path: '/fuel' },
        { icon: Brain, label: t.NAV_VAULT, path: '/vault' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-voidblack border-t border-white/10 px-6 pb-6 pt-4 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 group">
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute -top-4 w-8 h-1 bg-accent-neon shadow-[0_0_10px_#00f2ff]"
                                />
                            )}
                            <item.icon
                                size={24}
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive ? "text-accent-neon" : "text-gray-600 group-hover:text-white"
                                )}
                            />
                            <span className={cn(
                                "text-[10px] uppercase font-medium tracking-wider transition-colors",
                                "text-center",
                                isActive ? "text-accent-neon" : "text-gray-600 group-hover:text-white"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
