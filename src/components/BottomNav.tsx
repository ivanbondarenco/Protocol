import { LayoutDashboard, Dumbbell, Utensils, Brain, Users } from 'lucide-react';
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
        { icon: Users, label: 'Social', path: '/social' },
        { icon: Brain, label: t.NAV_VAULT, path: '/vault' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-voidblack/90 backdrop-blur-xl border-t border-white/10 px-4 pb-5 pt-3 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto gap-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} className={cn(
                            "relative flex flex-col items-center justify-center gap-1 group rounded-xl px-3 py-2 min-w-[58px] transition-colors",
                            isActive ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                        )}>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute -top-[1px] w-6 h-[2px] rounded-full bg-white/75"
                                />
                            )}
                            <item.icon
                                size={22}
                                className={cn(
                                    "transition-colors duration-300",
                                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-200"
                                )}
                            />
                            <span className={cn(
                                "text-[9px] uppercase font-semibold tracking-[0.08em] transition-colors",
                                "text-center",
                                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-200"
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
