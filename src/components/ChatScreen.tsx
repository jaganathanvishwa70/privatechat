import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Lock, MessageSquare, Trash2, Loader2, X, Menu, Pencil, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message, PendingFile } from '@/lib/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StorageUsage } from './StorageUsage';
import { ThemeToggle } from './ThemeToggle';

function newConversationTitle(): string {
  return new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' Chat';
}

interface ChatScreenProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLock: () => void;
}

export function ChatScreen({ darkMode, onToggleDarkMode, onLock }: ChatScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) {
      setConversations(data as Conversation[]);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      } else if (data.length === 0) {
        const { data: created } = await supabase
          .from('conversations')
          .insert({ title: newConversationTitle() })
          .select()
          .single();
        if (created) {
          setConversations([created as Conversation]);
          setActiveId(created.id);
        }
      }
    }
    setLoadingConvs(false);
  }, [activeId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    setLoadingMsgs(true);
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, attachments(*)')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      setMessages((data as Message[]) || []);
      setLoadingMsgs(false);
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    })();
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: atts } = await supabase
            .from('attachments')
            .select('*')
            .eq('message_id', newMsg.id);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, attachments: atts || [] }];
          });
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  async function sendMessage(payload: {
    messageType: string;
    content: string;
    language: string | null;
    files: PendingFile[];
  }) {
    if (!activeId) return;
    const isTextOnly = payload.content.trim().length === 0;
    const content = isTextOnly ? '' : payload.content;

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeId,
        message_type: payload.messageType,
        content,
        language: payload.language,
      })
      .select()
      .single();

    if (error || !msg) return;

    if (payload.files.length > 0) {
      const rows = payload.files
        .filter((f) => f.storagePath)
        .map((f) => ({
          message_id: msg.id,
          original_filename: f.file.name,
          storage_path: f.storagePath!,
          mime_type: f.file.type || 'application/octet-stream',
          file_size: f.file.size,
        }));
      if (rows.length > 0) {
        await supabase.from('attachments').insert(rows);
      }
    }

    const { data: atts } = await supabase.from('attachments').select('*').eq('message_id', msg.id);
    setMessages((prev) => [...prev, { ...(msg as Message), attachments: atts || [] }]);
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  async function startNewConversation() {
    const { data } = await supabase
      .from('conversations')
      .insert({ title: newConversationTitle() })
      .select()
      .single();
    if (data) {
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveId(data.id);
      setSidebarOpen(false);
    }
  }

  function beginRename(conversation: Conversation) {
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
  }

  function cancelRename() {
    setEditingConversationId(null);
    setEditingTitle('');
  }

  async function saveRename(id: string) {
    const title = editingTitle.trim();
    if (!title || savingTitle) return;
    setSavingTitle(true);
    const { data, error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)
      .select()
      .maybeSingle();
    setSavingTitle(false);
    if (error || !data) return;
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === id ? { ...conversation, title: data.title } as Conversation : conversation
    )));
    cancelRename();
  }

  async function deleteConversation(id: string) {
    if (!confirm('Delete this conversation? Messages and file references will be removed.')) return;
    await supabase.from('conversations').delete().eq('id', id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id ?? null);
      if (remaining.length === 0) {
        const { data: created } = await supabase
          .from('conversations')
          .insert({ title: newConversationTitle() })
          .select()
          .single();
        if (created) {
          setConversations([created as Conversation]);
          setActiveId(created.id);
        }
      }
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden transition-colors">
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-30 w-72 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">My Chats</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loadingConvs ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => { setActiveId(c.id); setSidebarOpen(false); }}
                className={`depth-item group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition mb-0.5 ${
                  c.id === activeId ? 'bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${c.id === activeId ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  {editingConversationId === c.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(c.id);
                          if (e.key === 'Escape') cancelRename();
                        }}
                        className="min-w-0 flex-1 px-2 py-1 text-sm text-slate-800 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                      <button
                        onClick={() => saveRename(c.id)}
                        disabled={!editingTitle.trim() || savingTitle}
                        className="p-1 text-emerald-600 hover:text-emerald-700 disabled:opacity-40"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm font-medium truncate ${c.id === activeId ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {c.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </>
                  )}
                </div>
                {editingConversationId !== c.id && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); beginRename(c); }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-emerald-600 transition p-1"
                      title="Rename chat"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition p-1"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-3 space-y-3 border-t border-slate-200 dark:border-slate-800">
          <StorageUsage />
          <button
            onClick={onLock}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <Lock className="w-4 h-4" /> Lock
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col h-full min-w-0 min-h-0 bg-slate-50 dark:bg-slate-950">
        <header className="shrink-0 sticky top-0 z-20 flex items-center gap-3 px-3 sm:px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-200 shadow-[0_1px_10px_rgba(15,23,42,0.04)]">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-slate-800 truncate flex-1">
            {activeConversation?.title || 'Chat'}
          </h1>
          <div className="flex items-center gap-1.5">
            <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} compact />
            <button onClick={onLock} className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center" title="Lock">
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <MessageList messages={messages} loading={loadingMsgs} />
          <div ref={messagesEndRef} />
        </div>

        <MessageInput onSend={sendMessage} disabled={!activeId} />
      </div>
    </div>
  );
}
