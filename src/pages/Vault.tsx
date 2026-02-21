import { GlitchText } from '../components/GlitchText';
import { NeonCard } from '../components/NeonCard';
import { Plus, X, BookOpen, Zap, Minus, BookPlus, Edit2, Clock3, Bold, Italic, Link2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useProtocolStore } from '../store/useProtocolStore';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_TRANSLATIONS } from '../data/translations';
import { api } from '../lib/api';


export const Vault = () => {
    const { books, addBook, updateBookProgress, addInsight, removeBook, updateBook, language, addIdea } = useProtocolStore();
    const t = APP_TRANSLATIONS[language];

    // Book Management State
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [editingBookId, setEditingBookId] = useState<string | null>(null); // null = adding new
    const [bookForm, setBookForm] = useState({
        title: '',
        author: '',
        pages: '',
        coverUrl: ''
    });

    const openAddModal = () => {
        setEditingBookId(null);
        setBookForm({ title: '', author: '', pages: '', coverUrl: '' });
        setIsBookModalOpen(true);
    };

    const openEditModal = (book: any) => {
        setEditingBookId(book.id);
        setBookForm({
            title: book.title,
            author: book.authors?.[0] || '',
            pages: book.pageCount?.toString() || '',
            coverUrl: book.coverUrl || ''
        });
        setIsBookModalOpen(true);
    };

    const handleSaveBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookForm.title || !bookForm.pages) return;

        const bookData = {
            title: bookForm.title,
            authors: [bookForm.author],
            pageCount: parseInt(bookForm.pages) || 0,
            coverUrl: bookForm.coverUrl
        };

        if (editingBookId) {
            updateBook(editingBookId, bookData);
        } else {
            addBook({
                id: Date.now().toString(),
                pagesRead: 0,
                category: 'Manual',
                ...bookData
            });
        }
        setIsBookModalOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBookForm(prev => ({ ...prev, coverUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Insight State
    const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
    const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
    const [newInsightText, setNewInsightText] = useState('');

    // Idea Spark State
    const [ideaText, setIdeaText] = useState('');
    const [shareWithAllies, setShareWithAllies] = useState(false);
    const [publishedToday, setPublishedToday] = useState(0);
    const [ideaError, setIdeaError] = useState<string | null>(null);
    const [isSavingIdea, setIsSavingIdea] = useState(false);
    const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
    const ideaInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const loadSparkMeta = async () => {
            try {
                const res = await api.get('/social/sparks/feed');
                setPublishedToday(res.myTodayCount || 0);
            } catch (e) {
                console.error('Could not load spark count', e);
            }
        };
        loadSparkMeta();
    }, []);

    const handleSaveIdea = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const normalized = ideaText.trim().replace(/\s+/g, ' ');
        if (!normalized) return;

        if (normalized.length > 400) {
            setIdeaError('Maximo 400 caracteres por chispa.');
            return;
        }

        setIdeaError(null);
        setIsSavingIdea(true);
        try {
            if (shareWithAllies) {
                const confirmed = window.confirm('Recuerda publicar informacion valiosa, esto es Protocol.');
                if (!confirmed) return;
                if (publishedToday >= 5) {
                    setIdeaError('Limite diario alcanzado: maximo 5 chispas compartidas por dia.');
                    return;
                }
                await api.post('/social/sparks', { content: normalized });
                setPublishedToday((prev) => prev + 1);
            } else {
                addIdea(normalized);
            }
            setIdeaText('');
        } catch (error: any) {
            const msg = String(error?.message || '');
            if (msg.includes('429')) {
                setIdeaError('Limite diario alcanzado: maximo 5 chispas compartidas por dia.');
            } else {
                setIdeaError('No se pudo guardar la chispa.');
            }
        } finally {
            setIsSavingIdea(false);
        }
    };

    const wrapSelection = (prefix: string, suffix: string) => {
        const el = ideaInputRef.current;
        if (!el) return;
        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const selected = ideaText.slice(start, end) || 'texto';
        const next = `${ideaText.slice(0, start)}${prefix}${selected}${suffix}${ideaText.slice(end)}`;
        setIdeaText(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        });
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



    return (
        <div className="min-h-screen bg-voidblack pb-24 px-4 pt-8 max-w-md mx-auto relative">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <GlitchText text={t.VAULT_TITLE} className="mb-2" />
                    <p className="text-gray-400 text-sm">{t.VAULT_SUBTITLE}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsPomodoroOpen(true)} className="bg-white/5 border border-white/10 p-2 rounded hover:bg-white/10">
                        <Clock3 size={20} className="text-white" />
                    </button>

                    <button onClick={openAddModal} className="bg-white/5 border border-white/10 p-2 rounded hover:bg-white/10">
                        <BookPlus size={20} className="text-accent-neon" />
                    </button>
                    {/* Removed old idea modal button */}
                    {/* Removed old search open button */}
                </div>
            </header>

            {/* Spark Posts */}
            <NeonCard className="mb-8 border-accent-neon/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-accent-neon font-bold flex items-center gap-2">
                        <Zap size={18} /> {t.IDEA_SPARK}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                        compartidas hoy: {publishedToday}/5
                    </p>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                    Chispas de Idea son posts sociales o individuales con contenido util, valorable o significativo para vos.
                    Tu Vault y el de los demas son preciados.
                </p>
                <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => wrapSelection('**', '**')} className="p-2 rounded border border-white/10 text-gray-300 hover:text-white">
                        <Bold size={14} />
                    </button>
                    <button type="button" onClick={() => wrapSelection('*', '*')} className="p-2 rounded border border-white/10 text-gray-300 hover:text-white">
                        <Italic size={14} />
                    </button>
                    <button type="button" onClick={() => wrapSelection('[', '](https://)')} className="p-2 rounded border border-white/10 text-gray-300 hover:text-white">
                        <Link2 size={14} />
                    </button>
                </div>
                <textarea
                    ref={ideaInputRef}
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    maxLength={400}
                    placeholder="Escribe una chispa valiosa para ti o para tus aliados..."
                    className="w-full min-h-[130px] bg-black/50 border border-white/10 rounded-md px-4 py-3 text-sm focus:border-accent-neon outline-none transition-all placeholder:text-gray-600 resize-y"
                />
                <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[11px] text-gray-400">
                        <input
                            type="checkbox"
                            checked={shareWithAllies}
                            onChange={(e) => setShareWithAllies(e.target.checked)}
                            className="accent-white"
                        />
                        Compartir con aliados (max 5/dia)
                    </label>
                    <p className="text-[10px] text-gray-500">{ideaText.trim().length}/400</p>
                </div>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={handleSaveIdea}
                        disabled={isSavingIdea}
                        className="flex-1 p-2 bg-accent-neon text-black rounded-md hover:opacity-80 transition-opacity text-xs font-bold uppercase"
                    >
                        {shareWithAllies ? 'Publicar chispa' : 'Guardar en Vault'}
                    </button>
                    <button
                        onClick={() => {
                            setIdeaText('');
                            setIdeaError(null);
                        }}
                        className="px-3 p-2 border border-white/10 text-gray-400 rounded-md text-xs uppercase"
                    >
                        Limpiar
                    </button>
                </div>
                {ideaError && <p className="text-[11px] text-red-400 mt-2">{ideaError}</p>}
                {!shareWithAllies && (
                    <p className="text-[10px] text-gray-500 mt-2">
                        Las chispas guardadas en tu Vault son ilimitadas.
                    </p>
                )}
            </NeonCard>

            {/* Book Protocols */}
            <section className="mb-8">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 tracking-[0.2em] text-sm">
                    <BookOpen size={16} className="text-accent-neon" /> {t.BOOK_PROTOCOLS}
                </h3>




                <div className="grid gap-4">
                    <AnimatePresence>
                        {books.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-gray-600 border border-dashed border-white/5 rounded-lg">
                                <BookPlus size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">{t.NO_BOOKS}</p>
                            </motion.div>
                        ) : (
                            books.map((book) => (
                                <NeonCard key={book.id} className="relative group">
                                    <div className="flex gap-4">
                                        <img
                                            src={book.coverUrl || 'https://via.placeholder.com/80x120?text=Book'}
                                            alt={book.title}
                                            className="w-20 h-28 object-cover rounded shadow-md bg-[#222]"
                                        />
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-sm leading-tight mb-1 pr-6">{book.title}</h4>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openEditModal(book)} className="text-gray-600 hover:text-accent-neon transition-colors">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => removeBook(book.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 mb-3">{book.authors?.join(', ')}</p>

                                                {/* Progress Bar moved up */}
                                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-3">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(book.pagesRead / book.pageCount) * 100}%` }}
                                                        className="h-full bg-accent-neon"
                                                    />
                                                </div>
                                            </div>

                                            {/* Controls Row - Moved BELOW Progress Bar */}
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{book.pagesRead} / {book.pageCount} p</span>
                                                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateBookProgress(book.id, Math.max(0, book.pagesRead - 1))}
                                                        className="p-1 hover:text-white"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateBookProgress(book.id, Math.min(book.pageCount, book.pagesRead + 1))}
                                                        className="p-1 hover:text-white"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </NeonCard>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Book List (old section, now integrated into Book Protocols) */}





            <AnimatePresence>
                {isPomodoroOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="w-full max-w-sm rounded-xl border border-white/10 bg-[#121212] p-6"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Clock3 size={16} /> Pomodoro
                                </h3>
                                <button onClick={() => setIsPomodoroOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="text-center">
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
                                <div className="text-5xl font-black font-mono text-white mb-6 tracking-tighter">
                                    {formatTime(pomoTime)}
                                </div>
                                <button
                                    onClick={togglePomo}
                                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto transition-all hover:scale-105 ${isPomoActive ? 'border-accent-alert text-accent-alert' : 'border-white text-white'}`}
                                >
                                    {isPomoActive ? <span className="block w-4 h-4 bg-accent-alert rounded-sm" /> : <span className="block w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Book Form Modal (Add/Edit) */}
            <AnimatePresence>
                {isBookModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 p-6 flex items-center justify-center backdrop-blur-sm">
                        <NeonCard className="w-full max-w-sm border-accent-neon/30">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-accent-neon font-bold uppercase">{editingBookId ? 'EDIT PROTOCOL' : 'NEW PROTOCOL'}</h3>
                                <button onClick={() => setIsBookModalOpen(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>

                            <form onSubmit={handleSaveBook} className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Title</label>
                                    <input
                                        required
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm outline-none focus:border-accent-neon rounded"
                                        placeholder="Book Title"
                                        value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Author</label>
                                    <input
                                        className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm outline-none focus:border-accent-neon rounded"
                                        placeholder="Author Name"
                                        value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Pages</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm outline-none focus:border-accent-neon rounded"
                                            placeholder="Total Pages"
                                            value={bookForm.pages} onChange={e => setBookForm({ ...bookForm, pages: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Cover Image</label>
                                        <input
                                            className="w-full bg-black/50 border border-white/10 p-3 text-white text-sm outline-none focus:border-accent-neon rounded mb-2"
                                            placeholder="https://..."
                                            value={bookForm.coverUrl.startsWith('data:') ? '' : bookForm.coverUrl}
                                            onChange={e => setBookForm({ ...bookForm, coverUrl: e.target.value })}
                                        />
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            onChange={handleFileChange}
                                            className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-accent-neon text-black font-bold py-3 uppercase text-xs hover:bg-white transition-colors mt-2 rounded">
                                    {editingBookId ? 'UPDATE PROTOCOL' : 'INITIATE PROTOCOL'}
                                </button>
                            </form>
                        </NeonCard>
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

