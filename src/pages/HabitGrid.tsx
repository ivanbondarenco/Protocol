import { GlitchText } from '../components/GlitchText';

export const HabitGrid = () => {
    // Mock data for grid - 7 days x 5 habits
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const habits = ['Deep Work', 'Workout', 'Diet', 'Reading', 'Focus'];

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto">
            <header className="mb-8">
                <GlitchText text="GRID VIEW" className="mb-2" />
                <p className="text-gray-400 text-sm">CONSISTENCY IS KING</p>
            </header>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-xs text-gray-500 font-normal">HABIT</th>
                            {days.map(d => <th key={d} className="p-2 text-xs text-center text-gray-500 font-normal">{d}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map((habit, hIdx) => (
                            <tr key={habit} className="border-b border-white/5 last:border-0">
                                <td className="p-3 text-xs font-bold text-white whitespace-nowrap">{habit}</td>
                                {days.map((day, dIdx) => {
                                    // Random active state for demo
                                    const active = (hIdx + dIdx) % 3 !== 0;
                                    return (
                                        <td key={day} className="p-1 text-center">
                                            <div className={`w-6 h-6 mx-auto rounded-sm ${active ? 'bg-white/80' : 'bg-white/5'}`}></div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
