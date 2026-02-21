import { useEffect, useMemo, useState } from 'react';
import { ArrowBigDown, ArrowBigUp, MessageCircle, Send, Zap } from 'lucide-react';
import { api } from '../../lib/api';

interface SparkComment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        name?: string;
        avatarUrl?: string;
    };
}

interface Spark {
    id: string;
    content: string;
    createdAt: string;
    upvotes: number;
    downvotes: number;
    myVote: number;
    comments: SparkComment[];
    user: {
        id: string;
        username: string;
        name?: string;
        avatarUrl?: string;
    };
}

const escapeHtml = (text: string) =>
    text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const markdownToHtml = (raw: string) => {
    let html = escapeHtml(raw);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\n/g, '<br />');
    return html;
};

export const SparkFeed = () => {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

    const load = async () => {
        try {
            const res = await api.get('/social/sparks/feed');
            setSparks(res.sparks || []);
        } catch (e) {
            console.error('Load sparks failed', e);
            setSparks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const sorted = useMemo(() => [...sparks], [sparks]);

    const vote = async (sparkId: string, value: 1 | -1) => {
        try {
            await api.post('/social/sparks/vote', { sparkId, value });
            await load();
        } catch (e) {
            console.error('Vote spark failed', e);
        }
    };

    const comment = async (sparkId: string) => {
        const content = (commentDrafts[sparkId] || '').trim();
        if (!content) return;
        try {
            await api.post('/social/sparks/comment', { sparkId, content });
            setCommentDrafts((prev) => ({ ...prev, [sparkId]: '' }));
            await load();
        } catch (e) {
            console.error('Comment spark failed', e);
        }
    };

    return (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-yellow-400" />
                <p className="text-xs font-bold uppercase text-white">Chispas</p>
            </div>

            {loading && <p className="text-[11px] text-gray-500">Cargando...</p>}
            {!loading && sorted.length === 0 && <p className="text-[11px] text-gray-500">Aun no hay chispas publicadas.</p>}

            {!loading && sorted.slice(0, 8).map((spark) => (
                <article key={spark.id} className="mb-3 last:mb-0 rounded-lg border border-white/10 bg-[#161616] p-3">
                    <div className="flex items-start gap-3 mb-2">
                        {spark.user.avatarUrl ? (
                            <img src={spark.user.avatarUrl} alt={spark.user.username} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                        ) : (
                            <div className="w-8 h-8 rounded-full border border-white/20 bg-neutral-800 flex items-center justify-center text-[10px] text-gray-300 font-bold">
                                {spark.user.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs text-white font-semibold truncate">{spark.user.username}</p>
                            <p className="text-[10px] text-gray-500">{new Date(spark.createdAt).toLocaleString()}</p>
                        </div>
                    </div>

                    <div
                        className="text-[12px] text-gray-200 leading-relaxed mb-3 break-words [&_a]:text-white [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(spark.content) }}
                    />

                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => vote(spark.id, 1)} className={`flex items-center gap-1 text-[11px] ${spark.myVote === 1 ? 'text-green-400' : 'text-gray-400'} hover:text-green-300`}>
                            <ArrowBigUp size={14} /> {spark.upvotes}
                        </button>
                        <button onClick={() => vote(spark.id, -1)} className={`flex items-center gap-1 text-[11px] ${spark.myVote === -1 ? 'text-red-400' : 'text-gray-400'} hover:text-red-300`}>
                            <ArrowBigDown size={14} /> {spark.downvotes}
                        </button>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MessageCircle size={13} /> {spark.comments.length}
                        </span>
                    </div>

                    <div className="space-y-2 mb-2 max-h-36 overflow-y-auto pr-1">
                        {spark.comments.map((c) => (
                            <div key={c.id} className="text-[11px] text-gray-300 border-l border-white/10 pl-2">
                                <span className="text-white font-semibold">{c.user.username}:</span> {c.content}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={commentDrafts[spark.id] || ''}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [spark.id]: e.target.value }))}
                            placeholder="Comentar..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-[11px] text-white outline-none focus:border-white/30"
                        />
                        <button onClick={() => comment(spark.id)} className="px-2 rounded-md border border-white/20 text-gray-300 hover:text-white">
                            <Send size={13} />
                        </button>
                    </div>
                </article>
            ))}
        </div>
    );
};
