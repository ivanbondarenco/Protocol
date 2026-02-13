import { GlitchText } from '../components/GlitchText';
import { NeonCard } from '../components/NeonCard';
import { Lightbulb, PlusCircle, MinusCircle, Search, X, AlertTriangle, Brain, Trash2, Edit2, Settings, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProtocolStore } from '../store/useProtocolStore';
import { AnimatePresence, motion } from 'framer-motion';
import type { Book } from '../types';
import { APP_TRANSLATIONS } from '../data/translations';

interface BookItemProps extends Book {
    onUpdate: (delta: number) => void;
    onExtract: () => void;
    onViewInsights: () => void;
}

const BookItem = (props: BookItemProps) => {
    const { title, pagesRead, pageCount, coverUrl, onUpdate, onExtract, onViewInsights } = props;
    const { language } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];
    const progress = Math.min((pagesRead / pageCount), 1);
    const grayscaleVal = 100 - (progress * 100);

    return (
        <div className="flex gap-4 mb-6 group relative">
            <div
                onClick={onViewInsights}
                className="relative w-24 h-36 flex-shrink-0 bg-gray-800 rounded overflow-hidden border border-white/10 group-hover:border-accent-neon transition-colors cursor-pointer"
            >
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{
                        backgroundImage: `url(${coverUrl})`,
                        filter: `grayscale(${grayscaleVal}%)`
                    }}
                />
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-white text-lg leading-tight mb-1">{title}</h3>
                <p className="text-xs text-gray-400 mb-2">{pagesRead} / {pageCount} {t.PAGES}</p>

                <div className="h-1 bg-white/10 rounded-full overflow-hidden w-full mb-2">
                    <div className="h-full bg-accent-neon" style={{ width: `${progress * 100}%` }} />
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-accent-neon">{Math.round(progress * 100)}% {t.COMPLETED_LABEL}</p>
                    <button onClick={onExtract} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300 hover:text-white hover:border-white uppercase">
                        {t.ADD_INSIGHT}
                    </button>
                </div>
            </div>

            <div className="absolute top-0 right-0 gap-2 hidden group-hover:flex">
                <button onClick={() => onUpdate(-10)} className="text-gray-500 hover:text-white"><MinusCircle size={16} /></button>
                <button onClick={() => onUpdate(10)} className="text-accent-neon hover:text-white"><PlusCircle size={16} /></button>
            </div>
        </div>
    );
};

export const Vault = () => {
    const { books, addBook, updateBookProgress, insights, addInsight, updateBook, removeBook, language } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];
    const [selectedBookSettingsId, setSelectedBookSettingsId] = useState<string | null>(null);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Manual Entry
    const [showManual, setShowManual] = useState(false);
    const [newBookTitle, setNewBookTitle] = useState('');
    const [newBookAuthor, setNewBookAuthor] = useState('');
    const [newBookPages, setNewBookPages] = useState('');

    // Insight State
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
    const [newInsightText, setNewInsightText] = useState('');
    const [viewingInsightsId, setViewingInsightsId] = useState<string | null>(null);

    // Idea Spark State
    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [ideaText, setIdeaText] = useState('');
    const [editingIdeaIndex, setEditingIdeaIndex] = useState<number | null>(null);
    const { history, addIdea, removeIdea, editIdea } = useProtocolStore();
    const today = new Date().toISOString().split('T')[0];
    const todaysIdeas = history[today]?.ideas || [];

    const handleSaveIdea = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!ideaText.trim()) return;

        if (editingIdeaIndex !== null) {
            editIdea(today, editingIdeaIndex, ideaText);
            setEditingIdeaIndex(null);
        } else {
            // Handle multi-line bullets if user pasted or typed multiple
            const lines = ideaText.split('\n').filter(l => l.trim());
            lines.forEach(line => addIdea(line.replace(/^[•\-\s]+/, ''))); // Strip existing bullets if any
        }

        setIdeaText('');
        setIsIdeaModalOpen(false);
    };

    const handleIdeaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        // Simple auto-bullet logic: if ends with newline, append bullet
        if (val.endsWith('\n') && !val.endsWith('• ')) {
            setIdeaText(val + '• ');
        } else {
            setIdeaText(val);
        }
    };

    // Pomodoro State
    const [pomoTime, setPomoTime] = useState(25 * 60);
    const [isPomoActive, setIsPomoActive] = useState(false);
    const [pomoMode, setPomoMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');

    useEffect(() => {
        let interval: number | undefined;
        if (isPomoActive && pomoTime > 0) {
            interval = window.setInterval(() => {
                setPomoTime(prev => prev - 1);
            }, 1000);
        } else if (pomoTime === 0) {
            setIsPomoActive(false);
            // Play sound or notify?
        }
        return () => clearInterval(interval);
    }, [isPomoActive, pomoTime]);

    const togglePomo = () => setIsPomoActive(!isPomoActive);
    const resetPomo = (mode: 'FOCUS' | 'BREAK') => {
        setIsPomoActive(false);
        setPomoMode(mode);
        setPomoTime(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const searchBooks = async () => {
        if (!query) return;
        setIsSearching(true);
        setErrorMsg(null);
        setSearchResults([]);
        setShowManual(false);

        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                setSearchResults(data.items);
            } else {
                setErrorMsg('NO DATA FOUND. INITIATE MANUAL ENTRY.');
                setShowManual(true);
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('CONNECTION FAILED. TERMINAL OFFLINE.');
            setShowManual(true);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddBook = (item: any) => {
        const info = item.volumeInfo;
        addBook({
            id: item.id || Date.now().toString(),
            title: info.title,
            authors: info.authors || ['Unknown'],
            pageCount: info.pageCount || 100,
            pagesRead: 0,
            coverUrl: info.imageLinks?.thumbnail || '',
            category: 'General'
        });
        setIsSearchOpen(false);
        resetSearch();
    };

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBookTitle) return;
        addBook({
            id: Date.now().toString(),
            title: newBookTitle,
            authors: [newBookAuthor || 'Unknown'],
            pageCount: parseInt(newBookPages) || 100,
            pagesRead: 0,
            coverUrl: '', // Could add placeholder
            category: 'Manual'
        });
        setIsSearchOpen(false);
        resetSearch();
    };

    const resetSearch = () => {
        setQuery('');
        setSearchResults([]);
        setShowManual(false);
        setNewBookTitle('');
        setNewBookAuthor('');
        setNewBookPages('');
        setErrorMsg(null);
    };

    const handleAddInsight = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBookId || !newInsightText) return;
        addInsight({
            id: Date.now().toString(),
            bookId: selectedBookId,
            text: newInsightText,
            date: new Date().toISOString()
        });
        setNewInsightText('');
        setIsInsightModalOpen(false);
        setSelectedBookId(null);
    };

    const activeInsights = viewingInsightsId ? insights.filter(i => i.bookId === viewingInsightsId) : [];

    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <GlitchText text={t.VAULT_TITLE} className="mb-2" />
                    <p className="text-gray-400 text-sm">{t.VAULT_SUBTITLE}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setIsIdeaModalOpen(true); setIdeaText('• '); }} className="bg-accent-neon/10 border border-accent-neon/50 p-2 rounded hover:bg-accent-neon hover:text-black transition-colors">
                        <Brain size={20} className="text-accent-neon hover:text-black" />
                    </button>
                    <button onClick={() => setIsSearchOpen(true)} className="bg-white/5 border border-white/10 p-2 rounded hover:bg-white/10">
                        <Search size={20} className="text-accent-neon" />
                    </button>
                </div>
            </header>

            {/* Pomodoro Timer */}
            <NeonCard className="mb-8 p-6 text-center relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${pomoMode === 'FOCUS' ? 'bg-accent-neon' : 'bg-blue-500'}`} />
                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={() => resetPomo('FOCUS')}
                        className={`text-[10px] font-bold uppercase tracking-widest ${pomoMode === 'FOCUS' ? 'text-accent-neon' : 'text-gray-600'}`}
                    >
                        {t.FOCUS_BTN}
                    </button>
                    <button
                        onClick={() => resetPomo('BREAK')}
                        className={`text-[10px] font-bold uppercase tracking-widest ${pomoMode === 'BREAK' ? 'text-blue-400' : 'text-gray-600'}`}
                    >
                        {t.BREAK_BTN}
                    </button>
                </div>

                <div className="text-6xl font-black font-mono text-white mb-6 tracking-tighter">
                    {formatTime(pomoTime)}
                </div>

                <button
                    onClick={togglePomo}
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto transition-all hover:scale-105 ${isPomoActive ? 'border-accent-alert text-accent-alert' : 'border-white text-white'}`}
                >
                    {isPomoActive ? <span className="block w-4 h-4 bg-accent-alert rounded-sm" /> : <span className="block w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />}
                </button>
            </NeonCard>

            {/* Book List */}
            <section className="space-y-4">
                {books.length === 0 && (
                    <div className="text-center py-10 text-gray-500 text-sm">{t.VAULT_EMPTY}</div>
                )}

                {books.map((book) => (
                    <NeonCard key={book.id} className="p-4 bg-carbonblack/80 relative group">
                        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedBookSettingsId(book.id)} className="text-gray-500 hover:text-white p-1 bg-black/50 rounded-full border border-white/10">
                                <Settings size={14} />
                            </button>
                        </div>

                        <BookItem
                            {...book}
                            onUpdate={(delta) => updateBookProgress(book.id, Math.min(Math.max(0, book.pagesRead + delta), book.pageCount))}
                            onExtract={() => { setSelectedBookId(book.id); setIsInsightModalOpen(true); }}
                            onViewInsights={() => setViewingInsightsId(viewingInsightsId === book.id ? null : book.id)}
                        />

                        {/* Inline Insight View */}
                        {viewingInsightsId === book.id && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden border-t border-white/5 pt-4">
                                <h4 className="text-xs font-bold text-accent-neon mb-2 uppercase flex gap-2"><Lightbulb size={12} /> {t.INTEL_EXTRACTS}</h4>
                                {activeInsights.length === 0 ? <p className="text-xs text-gray-500 italic">{t.NO_DATA_EXTRACTED}</p> : (
                                    <div className="space-y-3 pl-3 border-l border-white/10">
                                        {activeInsights.map(insight => (
                                            <div key={insight.id}>
                                                <p className="text-xs text-gray-300 italic">"{insight.text}"</p>
                                                <p className="text-[10px] text-gray-600 mt-1">{new Date(insight.date).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Book Settings Overlay */}
                        {selectedBookSettingsId === book.id && (
                            <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
                                <h4 className="text-accent-neon font-bold uppercase mb-4 text-sm">{t.BOOK_PROTOCOLS}</h4>
                                <div className="space-y-3 w-full max-w-xs">
                                    <div className="flex gap-2">
                                        <input
                                            placeholder={t.NEW_COVER_URL}
                                            className="flex-1 bg-white/5 border border-white/10 p-2 text-xs text-white outline-none focus:border-accent-neon"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    updateBook(book.id, { coverUrl: e.currentTarget.value });
                                                    setSelectedBookSettingsId(null);
                                                }
                                            }}
                                        />
                                        <button className="p-2 bg-white/10 text-white rounded hover:bg-white/20">
                                            <ImageIcon size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(t.DELETE_SOURCE_PROMPT)) {
                                                removeBook(book.id);
                                                setSelectedBookSettingsId(null);
                                            }
                                        }}
                                        className="w-full py-2 border border-accent-alert/50 text-accent-alert text-xs uppercase font-bold hover:bg-accent-alert hover:text-black transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={12} /> {t.DELETE_BOOK_BTN}
                                    </button>
                                    <button onClick={() => setSelectedBookSettingsId(null)} className="text-gray-500 text-xs hover:text-white mt-2">{t.CANCEL}</button>
                                </div>
                            </div>
                        )}
                    </NeonCard>
                ))}
            </section>



            {/* Brain Dump Section */}
            <section className="mb-20">
                <h3 className="text-accent-neon font-bold uppercase mb-4 flex gap-2 items-center text-sm">
                    <Brain size={16} /> {t.BRAIN_DUMP_TITLE} ({todaysIdeas.length})
                </h3>
                {todaysIdeas.length === 0 ? (
                    <div className="border border-white/5 p-4 rounded text-center">
                        <p className="text-gray-600 text-xs italic">{t.NO_IDEAS}</p>
                    </div>
                ) : (
                    <div className="bg-black border border-accent-neon/20 p-4 rounded font-mono text-xs text-green-400 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-accent-neon/50" />
                        <ul className="space-y-2 pl-2">
                            {todaysIdeas.map((idea, i) => (
                                <li key={i} className="flex gap-2 group relative pr-12">
                                    <span className="opacity-50">&gt;</span>
                                    <span>{idea}</span>
                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex gap-1 bg-black/80">
                                        <button onClick={() => { setIdeaText(idea); setEditingIdeaIndex(i); setIsIdeaModalOpen(true); }} className="text-gray-400 hover:text-accent-neon"><Edit2 size={12} /></button>
                                        <button onClick={() => { if (window.confirm(t.WIPE_IDEA_PROMPT)) removeIdea(today, i); }} className="text-gray-400 hover:text-accent-alert"><Trash2 size={12} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* Idea Modal */}
            <AnimatePresence>
                {isIdeaModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 pt-20 px-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: -50 }} animate={{ y: 0 }}
                            className="bg-gray-900/90 border border-accent-neon p-6 rounded-lg w-full max-w-md shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-accent-neon font-bold uppercase flex gap-2 items-center"><Brain size={18} /> {t.QUICK_CAPTURE}</h3>
                                <button onClick={() => setIsIdeaModalOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleSaveIdea}>
                                <textarea
                                    autoFocus
                                    className="w-full h-32 bg-black border border-white/10 p-3 text-green-400 font-mono text-sm outline-none focus:border-accent-neon rounded"
                                    placeholder={t.IDEA_PLACEHOLDER}
                                    value={ideaText}
                                    onChange={handleIdeaInput}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            handleSaveIdea();
                                        }
                                    }}
                                />
                                <div className="flex justify-end mt-4">
                                    <button type="submit" className="bg-accent-neon text-black font-bold px-6 py-2 uppercase text-xs tracking-wider rounded border border-accent-neon hover:bg-white hover:border-white transition-all shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                                        {t.CAPTURE_THOUGHT}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Modal */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 p-6 overflow-y-auto">
                        <div className="max-w-md mx-auto">
                            <div className="flex justify-between mb-6">
                                <h3 className="text-accent-neon font-bold uppercase">{t.ACQUIRE_BOOK}</h3>
                                <button onClick={() => setIsSearchOpen(false)}><X className="text-gray-500" /></button>
                            </div>

                            {/* Search Input */}
                            <div className="flex gap-2 mb-6">
                                <input
                                    autoFocus
                                    className="flex-1 bg-black/50 border border-white/10 p-3 text-white outline-none focus:border-accent-neon"
                                    placeholder={t.SEARCH_PLACEHOLDER}
                                    value={query} onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchBooks()}
                                />
                                <button onClick={searchBooks} disabled={isSearching} className="bg-white/10 px-4 rounded hover:bg-white/20">
                                    {isSearching ? '...' : <Search />}
                                </button>
                            </div>

                            {/* Messages */}
                            {errorMsg && (
                                <div className="bg-accent-alert/10 border border-accent-alert/50 p-3 mb-4 rounded flex gap-2 items-center">
                                    <AlertTriangle size={16} className="text-accent-alert" />
                                    <p className="text-accent-alert text-xs font-bold">{errorMsg === 'NO DATA FOUND. INITIATE MANUAL ENTRY.' ? t.NO_DATA_FOUND : errorMsg === 'CONNECTION FAILED. TERMINAL OFFLINE.' ? t.CONNECTION_FAILED : errorMsg}</p>
                                </div>
                            )}

                            {/* Results */}
                            <div className="space-y-4 mb-6">
                                {searchResults.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 p-3 border border-white/10 rounded items-center bg-carbonblack hover:border-accent-neon/30 transition-colors">
                                        {item.volumeInfo.imageLinks?.thumbnail ? (
                                            <img src={item.volumeInfo.imageLinks.thumbnail} className="w-12 h-16 object-cover" />
                                        ) : <div className="w-12 h-16 bg-white/5" />}
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold text-sm line-clamp-1">{item.volumeInfo.title}</h4>
                                            <p className="text-gray-500 text-xs">{item.volumeInfo.authors?.[0]}</p>
                                        </div>
                                        <button onClick={() => handleAddBook(item)} className="text-accent-neon hover:text-white px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase font-bold">
                                            {t.ADD_BTN}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Manual Entry Fallback */}
                            {showManual && (
                                <div className="border-t border-white/10 pt-6">
                                    <h4 className="text-white font-bold text-xs uppercase mb-4">{t.MANUAL_OVERRIDE}</h4>
                                    <form onSubmit={handleManualAdd} className="space-y-3">
                                        <input placeholder={t.BOOK_TITLE_PH} value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm" />
                                        <input placeholder={t.AUTHOR_PH} value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm" />
                                        <input placeholder={t.TOTAL_PAGES_PH} type="number" value={newBookPages} onChange={e => setNewBookPages(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm" />
                                        <button className="w-full bg-white/10 text-white font-bold py-3 uppercase text-xs hover:bg-white hover:text-black">{t.SAVE_MANUAL}</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Insight Modal */}
            <AnimatePresence>
                {isInsightModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                        <motion.div className="bg-carbonblack border border-accent-neon/30 p-6 rounded w-full max-w-sm">
                            <h3 className="text-accent-neon font-bold uppercase mb-4">{t.EXTRACT_INTEL}</h3>
                            <form onSubmit={handleAddInsight}>
                                <textarea
                                    autoFocus
                                    className="w-full h-32 bg-black/50 border border-white/10 p-3 text-white text-sm outline-none focus:border-accent-neon mb-4"
                                    placeholder={t.INSIGHT_PLACEHOLDER}
                                    value={newInsightText} onChange={e => setNewInsightText(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsInsightModalOpen(false)} className="text-xs text-gray-500 uppercase px-4 py-2 hover:text-white">{t.CANCEL}</button>
                                    <button type="submit" className="bg-accent-neon text-black font-bold px-4 py-2 uppercase text-xs tracking-wider rounded">{t.SAVE_DATA}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
