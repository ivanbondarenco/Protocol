import { useState } from 'react';
import { GlitchText } from '../components/GlitchText';
import { AllyList } from '../components/social/AllyList';
import { HeroStreak } from '../components/social/HeroStreak';
import { SparkFeed } from '../components/social/SparkFeed';

type Section = 'RESUMEN' | 'ALIADOS' | 'RACHA';

const sections: Section[] = ['RESUMEN', 'ALIADOS', 'RACHA'];

export const Social = () => {
    const [activeSection, setActiveSection] = useState<Section>('RESUMEN');

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto">
            <header className="mb-6">
                <GlitchText text="SOCIAL" className="mb-2" />
                <p className="text-gray-400 text-sm">Aliados, pings e impacto en tu racha.</p>
            </header>

            <div className="mb-5 grid grid-cols-3 gap-2">
                {sections.map((section) => (
                    <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        className={`py-2 text-[10px] uppercase tracking-wider border rounded-lg transition-colors ${activeSection === section ? 'border-white text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                    >
                        {section}
                    </button>
                ))}
            </div>

            {activeSection === 'RESUMEN' && (
                <>
                    <SparkFeed />
                    <AllyList view="summary" />
                </>
            )}
            {activeSection === 'ALIADOS' && <AllyList view="trackers" />}
            {activeSection === 'RACHA' && <HeroStreak />}
        </div>
    );
};
