
import { AllyList } from './AllyList';
import { HeroStreak } from './HeroStreak';

export const SocialModule = () => {
    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
            <AllyList />
            <HeroStreak />
        </div>
    );
};
