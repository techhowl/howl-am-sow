'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit2, Check, X, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function renderWithMentions(content) {
    const parts = content.split(/(@[a-zA-Z0-9_ ]+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return (
                <span key={i} className="text-indigo-600 font-medium bg-indigo-50 rounded px-0.5">
                    {part}
                </span>
            );
        }
        return part;
    });
}

function CommentItem({ comment, currentUserId, currentUserRole, taskId, onDeleted, onEdited }) {
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [saving, setSaving] = useState(false);

    const isAuthor = comment.authorId?._id === currentUserId || comment.authorId === currentUserId;
    const isAdmin = currentUserRole === 'admin';
    const canDelete = isAuthor || isAdmin;
    const canEdit = isAuthor;

    async function handleDelete() {
        if (!confirm('Delete this comment?')) return;
        const res = await fetch(`/api/tasks/${taskId}/comments/${comment._id}`, {
            method: 'DELETE',
        });
        if (res.ok) onDeleted(comment._id);
    }

    async function handleEdit() {
        if (!editContent.trim()) return;
        setSaving(true);
        const res = await fetch(`/api/tasks/${taskId}/comments/${comment._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
        });
        const data = await res.json();
        if (res.ok) {
            onEdited(data.comment);
            setEditing(false);
        }
        setSaving(false);
    }

    const author = comment.authorId;
    const authorName = author?.name || 'Unknown';
    const initial = authorName[0]?.toUpperCase();

    return (
        <div className="flex gap-3 group">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-indigo-700">{initial}</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-900">{authorName}</span>
                    <span className="text-xs text-gray-400 capitalize">{author?.role?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.isEdited && (
                        <span className="text-xs text-gray-300 italic">· edited</span>
                    )}
                </div>

                {editing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleEdit}
                                disabled={saving}
                                className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Check className="w-3 h-3" />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={() => { setEditing(false); setEditContent(comment.content); }}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                        {renderWithMentions(comment.content)}
                    </div>
                )}
            </div>

            {/* Actions */}
            {!editing && (canEdit || canDelete) && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    {canEdit && (
                        <button
                            onClick={() => setEditing(true)}
                            className="p-1 text-gray-400 hover:text-indigo-500 rounded transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CommentThread({ taskId, currentUserId, currentUserRole, brandMembers = [] }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const textareaRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    async function fetchComments() {
        setLoading(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`);
            const data = await res.json();
            setComments(data.comments || []);
        } finally {
            setLoading(false);
        }
    }

    function handleContentChange(e) {
        const val = e.target.value;
        setContent(val);

        // Detect @ trigger for mention suggestions
        const cursor = e.target.selectionStart;
        const textUpToCursor = val.slice(0, cursor);
        const mentionMatch = textUpToCursor.match(/@([a-zA-Z0-9_ ]*)$/);

        if (mentionMatch) {
            const query = mentionMatch[1].toLowerCase();
            setMentionQuery(query);
            const filtered = brandMembers.filter((m) =>
                m.userId?.name?.toLowerCase().includes(query)
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }

    function insertMention(name) {
        const cursor = textareaRef.current?.selectionStart || content.length;
        const before = content.slice(0, cursor);
        const after = content.slice(cursor);
        const mentionStart = before.lastIndexOf('@');
        const newContent = before.slice(0, mentionStart) + `@${name} ` + after;
        setContent(newContent);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    }

    async function handleSubmit() {
        if (!content.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (res.ok) {
                setComments((prev) => [...prev, data.comment]);
                setContent('');
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } finally {
            setSubmitting(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') setShowSuggestions(false);
    }

    function handleDeleted(commentId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
    }

    function handleEdited(updatedComment) {
        setComments((prev) =>
            prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Comment list */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-400">No comments yet. Be the first to comment.</p>
                    </div>
                ) : (
                    comments.map((c) => (
                        <CommentItem
                            key={c._id}
                            comment={c}
                            currentUserId={currentUserId}
                            currentUserRole={currentUserRole}
                            taskId={taskId}
                            onDeleted={handleDeleted}
                            onEdited={handleEdited}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-100 pt-4 relative">
                {/* Mention suggestions */}
                {showSuggestions && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {suggestions.map((m) => (
                            <button
                                key={m.userId?._id}
                                onClick={() => insertMention(m.userId?.name)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50 transition-colors text-left"
                            >
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-semibold text-indigo-700">
                                        {m.userId?.name?.[0]?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{m.userId?.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{m.userId?.role?.replace(/_/g, ' ')}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 items-end">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a comment... Use @ to mention someone"
                        rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-gray-300"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || submitting}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        title="Send (Ctrl+Enter)"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-gray-300 mt-1.5 ml-1">Ctrl+Enter to send</p>
            </div>
        </div>
    );
}