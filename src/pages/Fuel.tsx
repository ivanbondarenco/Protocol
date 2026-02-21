import { GlitchText } from '../components/GlitchText';
import { Droplets, Flame, Plus, X, ChefHat, Search, Settings, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { NeonCard } from '../components/NeonCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useProtocolStore } from '../store/useProtocolStore';
import { getProtocolDate } from '../lib/dateUtils';
import { FUEL_SOURCES, type Recipe as LocalRecipe } from '../data/recipes';
import { APP_TRANSLATIONS } from '../data/translations';
import { searchRecipes, checkApiConfig, type Recipe as APIRecipe } from '../services/recipeService';

const MacroItem = ({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs uppercase mb-1">
            <span className="text-gray-400">{label}</span>
            <span className="text-white">{Math.round(current)}/{target}g</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
                className={`h-full ${colorClass} transition-all duration-500`}
                style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
            />
        </div>
    </div>
);

export const Fuel = () => {
    const { history, logWater, logNutrition, bioData, macroTargets, hydrationTargetMl, updateBioData, recalculateTargets, language } = useProtocolStore();
    const todayKey = getProtocolDate();
    const log = history[todayKey] || {};
    // Translation Hook
    const t = APP_TRANSLATIONS[language];

    const waterIntake = log.waterIntake || 0;
    const macros = log.macros || { protein: 0, carbs: 0, fats: 0, calories: 0 };
    const burned = log.caloriesBurned || 0;

    const WATER_TARGET = hydrationTargetMl || 3000;

    // Net Calories Logic
    const caloriesLeft = (macroTargets.calories + burned) - macros.calories;
    const progress = (macros.calories / (macroTargets.calories + burned)) * 100;

    // Deficit Alert Logic (After 20:00)
    const currentHour = new Date().getHours();
    const proteinDeficit = macroTargets.protein - macros.protein;
    const isProteinDeficit = currentHour >= 20 && proteinDeficit > 50;

    // UI States
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddValue, setQuickAddValue] = useState('');
    const [isCalibrateOpen, setIsCalibrateOpen] = useState(false);
    const [scavengerInput, setScavengerInput] = useState('');
    const [smartRecipe, setSmartRecipe] = useState<LocalRecipe | null>(null);
    const [scavengerResults, setScavengerResults] = useState<APIRecipe[]>([]);
    const [nextPageHref, setNextPageHref] = useState<string | null>(null);
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
    const [scavengerAlert, setScavengerAlert] = useState<string | null>(null);
    const [selectedBlueprint, setSelectedBlueprint] = useState<LocalRecipe | null>(null); // For Blueprint Modal
    const [selectedApiRecipe, setSelectedApiRecipe] = useState<APIRecipe | null>(null); // For API Modal
    const [isMacroViewOpen, setIsMacroViewOpen] = useState(false); // Default hidden

    // Dynamic Color Logic
    let progressColor = 'bg-white/70';
    if (progress >= 90 && progress <= 110) progressColor = 'bg-green-500';
    else if (progress > 110) progressColor = 'bg-red-500';

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseInt(quickAddValue);
        if (val) {
            logNutrition({ calories: val });
            setQuickAddValue('');
            setIsQuickAddOpen(false);
        }
    };

    const handleCalibrate = () => {
        recalculateTargets();
        setIsCalibrateOpen(false);
        alert('SYSTEM CALIBRATED. TARGETS UPDATED.');
    };

    const generateSmartFuel = () => {
        const potential = FUEL_SOURCES.filter(r => r.calories <= caloriesLeft);
        if (potential.length > 0) {
            const random = potential[Math.floor(Math.random() * potential.length)];
            setSmartRecipe(random);
        } else {
            alert('NO RECIPES FIT YOUR REMAINING CALORIES. DRINK WATER.');
        }
    };

    const handleScavengerSearch = async (loadMore = false) => {
        if (!scavengerInput.trim() && !loadMore) return;

        setIsLoadingRecipes(true);
        if (!loadMore) setScavengerAlert(null); // Clear old alerts if new search

        if (!checkApiConfig()) {
            setScavengerAlert('API KEYS MISSING. CHECK CONSOLE/ENV.');
            setIsLoadingRecipes(false);
            return;
        }

        const query = loadMore && nextPageHref ? nextPageHref : scavengerInput;
        const { recipes, nextHref } = await searchRecipes(query);

        if (recipes.length === 0 && !loadMore) {
            setScavengerAlert(t.NO_FUEL_MATCH);
        }

        if (loadMore) {
            setScavengerResults(prev => [...prev, ...recipes]);
        } else {
            setScavengerResults(recipes);
        }

        setNextPageHref(nextHref);
        setIsLoadingRecipes(false);
    };

    const logRecipe = (recipe: LocalRecipe) => {
        if (window.confirm(`LOG ${recipe.name.toUpperCase()}?`)) {
            logNutrition({
                protein: recipe.protein,
                carbs: recipe.carbs,
                fats: recipe.fats,
                calories: recipe.calories
            });
            setSmartRecipe(null);
            setScavengerResults([]);
            setScavengerInput('');
            setSelectedBlueprint(null);
        }
    };

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <GlitchText text={t.FUEL_TITLE} className="mb-2" />
                    <p className="text-gray-400 text-sm">{t.FUEL_SUBTITLE}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsCalibrateOpen(true)} className="text-gray-500 hover:text-white transition-colors">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* Calories Main - Toggle Macros on Click */}
            <NeonCard className="mb-8 text-center py-8 relative cursor-pointer group" onClick={() => setIsMacroViewOpen(!isMacroViewOpen)}>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsQuickAddOpen(true); }}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
                >
                    <Plus size={24} />
                </button>

                <Flame className={`mx-auto mb-2 transition-colors ${progress > 110 ? 'text-red-400' : 'text-white'}`} size={32} />

                <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold font-mono text-white mb-1 transition-all">
                        {Math.round(caloriesLeft)}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest mb-4">
                        {t.CALORIES_LEFT}
                    </span>

                    <div className="flex gap-4 text-[10px] text-gray-400 uppercase font-mono mb-4">
                        <div className="flex flex-col">
                            <span className="text-white font-bold">{macroTargets.calories}</span>
                            <span>{t.BASE}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">+{burned}</span>
                            <span>{t.BURNED_LABEL}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-red-400 font-bold">-{Math.round(macros.calories)}</span>
                            <span>{t.EATEN}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-2 px-8">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full">
                        <div className={`h-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <div className="mt-2 text-gray-500 flex justify-center">
                        {isMacroViewOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>

                {/* Quick Actions Removed for V4 Precision */}
            </NeonCard>

            {/* Macros - Collapsible */}
            <AnimatePresence>
                {isMacroViewOpen && (
                    <motion.section
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-8 overflow-hidden"
                    >
                        <h2 className="text-white text-sm font-bold uppercase mb-4 flex justify-between items-center">
                            {t.MACROS_TITLE}
                            {isProteinDeficit && (
                                <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold animate-pulse">
                                    {t.PROTEIN_DEFICIT}
                                </span>
                            )}
                        </h2>
                        <div className={`bg-carbonblack border p-5 rounded-xl transition-colors duration-500 ${isProteinDeficit ? 'border-red-500/40' : 'border-white/10'}`}>
                            <MacroItem label={t.PROTEIN} current={macros.protein} target={macroTargets.protein} colorClass={isProteinDeficit ? "bg-red-500" : "bg-white"} />
                            <MacroItem label={t.CARBS} current={macros.carbs} target={macroTargets.carbs} colorClass="bg-blue-500" />
                            <MacroItem label={t.FATS} current={macros.fats} target={macroTargets.fats} colorClass="bg-yellow-500" />
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Smart Chef & Scavenger Mode */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <NeonCard className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={generateSmartFuel}>
                    <div className="flex flex-col items-center text-center gap-2">
                        <ChefHat className="text-white" size={24} />
                        <span className="text-xs font-bold text-white">{t.SMART_CHEF}</span>
                        <span className="text-[10px] text-gray-500">{t.GENERATE_FUEL}</span>
                    </div>
                </NeonCard>

                <NeonCard className="p-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Search className="text-blue-400" size={16} />
                            <span className="text-xs font-bold text-white">{t.SCAVENGER}</span>
                        </div>
                        <input
                            type="text"
                            className="bg-black/50 border border-white/10 text-[10px] text-white p-2 rounded-xl outline-none focus:border-white/40 w-full"
                            placeholder={t.SCAVENGER_PLACEHOLDER}
                            value={scavengerInput}
                            onChange={(e) => {
                                setScavengerInput(e.target.value);
                                setScavengerAlert(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleScavengerSearch(false)}
                        />
                        <button
                            onClick={() => handleScavengerSearch(false)}
                            disabled={isLoadingRecipes || !scavengerInput.trim()}
                            className="w-full py-2 bg-white text-black border border-white text-[10px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-50"
                        >
                            {isLoadingRecipes ? 'BUSCANDO...' : 'BUSCAR INGREDIENTES'}
                        </button>
                    </div>
                </NeonCard>
            </div>

            {/* Scavenger Alerts */}
            {scavengerAlert && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-red-500/10 border border-red-500/40 p-4 rounded-xl text-center">
                    <div className="flex justify-center mb-2"><AlertTriangle className="text-red-400" size={24} /></div>
                    <div className="text-red-300 font-bold text-xs whitespace-pre-line font-mono">{scavengerAlert}</div>
                </motion.div>
            )}

            {/* Recipe Display Area (Smart Chef Results) */}
            <AnimatePresence>
                {smartRecipe && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8">
                        <div
                            className="bg-carbonblack border border-white/15 p-4 rounded-xl relative overflow-hidden cursor-pointer hover:bg-white/5"
                            onClick={() => setSelectedBlueprint(smartRecipe)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-bold uppercase">{smartRecipe.name}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setSmartRecipe(null); }}><X size={16} className="text-gray-500" /></button>
                            </div>
                            <div className="flex gap-4 text-[10px] text-gray-400 font-mono mb-4">
                                <span>{smartRecipe.calories} kcal</span>
                                <span className="text-white">{smartRecipe.protein}g PRO</span>
                                <span>{smartRecipe.prepTime} MIN</span>
                            </div>
                            <div className="text-[10px] text-white font-bold uppercase tracking-widest text-center border-t border-white/10 pt-2">
                                TAP TO VIEW BLUEPRINT
                            </div>
                        </div>
                    </motion.div>
                )}
                {scavengerResults.length > 0 && (
                    <div className="mb-8 space-y-4">
                        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">{t.FOUND_RECIPES}: {scavengerResults.length}</h3>
                        {scavengerResults.map(recipe => (
                            <motion.div
                                key={recipe.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-carbonblack border border-white/10 p-0 rounded-xl overflow-hidden flex flex-col group hover:border-white/40 transition-colors cursor-pointer"
                                onClick={() => setSelectedApiRecipe(recipe)}
                            >
                                <div className="h-32 w-full relative">
                                    <img src={recipe.image} alt={recipe.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                        <h4 className="text-white font-bold text-sm uppercase line-clamp-1">{recipe.label}</h4>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] text-white font-mono border border-white/20">
                                        {recipe.calories} KCAL
                                    </div>
                                </div>
                                <div className="p-3 flex justify-between items-center bg-black/50">
                                    <div className="flex gap-3 text-[10px] text-gray-400 font-mono">
                                        <span>{recipe.protein}g PRO</span>
                                        <span>{recipe.prepTime} MIN</span>
                                    </div>
                                    <div className="text-white text-[10px] font-bold uppercase tracking-wider">VIEW INTEL</div>
                                </div>
                            </motion.div>
                        ))}
                        {nextPageHref && (
                            <button
                                onClick={() => handleScavengerSearch(true)}
                                disabled={isLoadingRecipes}
                                className="w-full py-3 bg-white/5 border border-white/10 text-xs text-gray-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors flex justify-center gap-2"
                            >
                                {isLoadingRecipes ? 'LOADING...' : 'LOAD MORE DATA'}
                            </button>
                        )}
                    </div>
                )}
            </AnimatePresence>

            {/* API Recipe Modal */}
            <AnimatePresence>
                {selectedApiRecipe && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
                        onClick={() => setSelectedApiRecipe(null)}
                    >
                        <div className="bg-carbonblack border border-white/15 p-0 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
                            <div className="h-48 w-full relative">
                                <img src={selectedApiRecipe.image} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                <button onClick={() => setSelectedApiRecipe(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition-colors">
                                    <X size={20} />
                                </button>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h2 className="text-xl font-bold text-white uppercase leading-tight shadow-black drop-shadow-md">{selectedApiRecipe.label}</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-mono text-white font-bold">{selectedApiRecipe.calories}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Calories</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-mono text-white font-bold">{selectedApiRecipe.protein}g</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Protein</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-mono text-blue-400 font-bold">{selectedApiRecipe.prepTime}m</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Time</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-white text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                        <ChefHat size={14} /> {t.MATERIAL_LIST}
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedApiRecipe.ingredients.map((line, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex gap-2">
                                                <span className="text-white">•</span>
                                                {line}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex gap-2">
                                    <a
                                        href={selectedApiRecipe.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-white text-black font-bold py-3 text-center uppercase text-sm tracking-wider rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        COOK THIS
                                    </a>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`LOG ${selectedApiRecipe.label.toUpperCase()}?`)) {
                                                logNutrition({
                                                    calories: selectedApiRecipe.calories,
                                                    protein: selectedApiRecipe.protein
                                                });
                                                setSelectedApiRecipe(null);
                                            }
                                        }}
                                        className="flex-1 bg-white/10 text-white font-bold py-3 text-center uppercase text-sm tracking-wider rounded hover:bg-white/20 transition-colors"
                                    >
                                        LOG MACROS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blueprint Modal (Recipe Detail) */}
            <AnimatePresence>
                {selectedBlueprint && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 backdrop-blur-md"
                        onClick={() => setSelectedBlueprint(null)}
                    >
                        <div className="bg-carbonblack border border-white/15 p-6 rounded-xl w-full max-w-sm h-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">FUEL BLUEPRINT</div>
                                    <GlitchText text={selectedBlueprint.name} className="text-lg" />
                                </div>
                                <button onClick={() => setSelectedBlueprint(null)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>

                            {/* Specs */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
                                    <div className="text-[10px] text-gray-500">PREP TIME</div>
                                    <div className="text-white font-mono">{selectedBlueprint.prepTime} MIN</div>
                                </div>
                                <div className="bg-black/30 p-2 rounded border border-white/5 text-center">
                                    <div className="text-[10px] text-gray-500">ENERGY</div>
                                    <div className="text-white font-mono">{selectedBlueprint.calories} KCAL</div>
                                </div>
                            </div>

                            {/* Materials List */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-white uppercase mb-2 border-b border-white/20 pb-1 inline-block">MATERIAL LIST</h4>
                                <ul className="space-y-2">
                                    {selectedBlueprint.ingredients.map((ing, i) => (
                                        <li key={i} className="flex justify-between text-xs border-b border-white/5 pb-1 last:border-0">
                                            <span className="text-gray-300">{ing.item}</span>
                                            <span className="text-white font-mono">{ing.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Macro Table */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 border-b border-blue-400/30 pb-1 inline-block">MACRO SPECS</h4>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-[9px] text-gray-500">PRO</div>
                                        <div className="text-white font-bold">{selectedBlueprint.protein}g</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-[9px] text-gray-500">CARB</div>
                                        <div className="text-blue-400 font-bold">{selectedBlueprint.carbs}g</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded">
                                        <div className="text-[9px] text-gray-500">FAT</div>
                                        <div className="text-yellow-500 font-bold">{selectedBlueprint.fats}g</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => logRecipe(selectedBlueprint)}
                                className="w-full rounded-xl bg-white text-black font-bold py-3 hover:bg-gray-200 transition-colors uppercase tracking-widest"
                            >
                                EXECUTE PROTOCOL (LOG)
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Water Intake */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white text-sm font-bold uppercase flex items-center gap-2">
                        <Droplets size={16} className="text-white" /> {t.HYDRATION_TITLE}
                    </h2>
                    <span className="text-xs font-mono text-white">{waterIntake} / {WATER_TARGET}ml</span>
                </div>

                {/* Dynamic Water Bar */}
                <div className="mb-4 h-4 bg-white/5 rounded-full overflow-hidden relative border border-white/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((waterIntake / WATER_TARGET) * 100, 100)}%` }}
                        className="h-full bg-white/75"
                    />
                </div>

                <div className="flex gap-4">
                    <button onClick={() => logWater(250)} className="flex-1 bg-white/5 border border-white/20 text-white py-3 rounded-xl text-xs font-bold hover:bg-white hover:text-black transition-colors">
                        + 250ml
                    </button>
                    <button onClick={() => logWater(500)} className="flex-1 bg-white/5 border border-white/20 text-white py-3 rounded-xl text-xs font-bold hover:bg-white hover:text-black transition-colors">
                        + 500ml
                    </button>
                </div>
            </section>

            {/* Calibration Modal */}
            <AnimatePresence>
                {isCalibrateOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 backdrop-blur-md"
                    >
                        <div className="bg-carbonblack border border-white/10 p-6 rounded-xl w-full max-w-sm h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-bold uppercase tracking-widest">METABOLIC CALIBRATION</h3>
                                <button onClick={() => setIsCalibrateOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Edad</label>
                                        <input type="number" value={bioData.age} onChange={(e) => updateBioData({ age: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 p-2 text-sm text-white rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Peso (kg)</label>
                                        <input type="number" value={bioData.weight} onChange={(e) => updateBioData({ weight: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 p-2 text-sm text-white rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Altura (cm)</label>
                                        <input type="number" value={bioData.height} onChange={(e) => updateBioData({ height: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 p-2 text-sm text-white rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1">Entreno diario (min)</label>
                                        <input type="number" value={bioData.trainingMinutes} onChange={(e) => updateBioData({ trainingMinutes: parseInt(e.target.value) || 0 })} className="w-full bg-black/50 border border-white/10 p-2 text-sm text-white rounded" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Sexo biologico</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['MALE', 'FEMALE'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => updateBioData({ sex: s as 'MALE' | 'FEMALE' })}
                                                className={`py-2 rounded-xl text-[10px] border transition-colors ${bioData.sex === s ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Clima habitual</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['COLD', 'TEMPERATE', 'HOT'].map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => updateBioData({ climate: c as 'COLD' | 'TEMPERATE' | 'HOT' })}
                                                className={`py-2 rounded-xl text-[10px] border transition-colors ${bioData.climate === c ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Objective</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['CUT', 'MAINTAIN', 'BULK'].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => updateBioData({ goal: g as any })}
                                                className={`py-2 rounded-xl text-[10px] border transition-colors ${bioData.goal === g ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 uppercase mb-1">Fuel Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['BALANCED', 'LOW_CARB', 'KETO', 'HIGH_PROTEIN'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => updateBioData({ type: t as any })}
                                                className={`py-2 rounded-xl text-[10px] border transition-colors ${bioData.type === t ? 'border-white/40 text-white bg-white/10' : 'border-white/10 text-gray-500 hover:text-white'}`}
                                            >
                                                {t.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
                                    <p>Objetivo estimado post-calibracion:</p>
                                    <p className="text-white font-semibold mt-1">{macroTargets.calories} kcal / dia</p>
                                    <p className="text-white font-semibold">{WATER_TARGET} ml agua / dia</p>
                                </div>

                                <button onClick={handleCalibrate} className="w-full rounded-xl bg-white text-black font-bold py-3 mt-4 hover:bg-gray-200 transition-colors">
                                    {t.CALIBRATE_SYSTEM}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Add Modal */}
            <AnimatePresence>
                {isQuickAddOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
                        onClick={(e) => { e.stopPropagation(); setIsQuickAddOpen(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-carbonblack border border-white/15 p-6 rounded-xl w-full max-w-sm shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold uppercase">{t.MANUAL_INPUT}</h3>
                                <button onClick={() => setIsQuickAddOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleManualAdd} className="flex gap-2">
                                <input
                                    type="number" autoFocus
                                    className="flex-1 bg-black/50 border border-white/10 p-3 text-white text-lg font-mono focus:border-white/40 outline-none rounded-lg"
                                    placeholder="Calories..."
                                    value={quickAddValue} onChange={e => setQuickAddValue(e.target.value)}
                                />
                                <button type="submit" className="bg-white text-black font-bold px-4 rounded-lg hover:bg-gray-200 transition-colors">{t.ADD_BTN}</button>
                            </form>
                            <div className="mt-4 text-[10px] text-gray-500 text-center uppercase tracking-widest">
                                Inputting raw energy value
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
