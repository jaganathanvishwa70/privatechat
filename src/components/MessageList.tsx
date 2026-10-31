import { useState } from 'react';
import { FileAttachmentCard, ImageAttachment } from './FileAttachmentCard';
import { CodeMessage } from './CodeMessage';
import { ImageViewer } from './ImageViewer';
import { formatTime, formatDateLabel } from '@/lib/utils';
import type { Message, Attachment } from '@/lib/types';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export function MessageList({ messages, loading }: MessageListProps) {
  const [viewer, setViewer] = useState<Attachment | null>(null);
  const images = messages.filter((m) => m.attachments?.some((a) => a.mime_type.startsWith('image/')));

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-sm">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center opacity-80">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Start your conversation</p>
            <p className="text-xs text-slate-400 text-center max-w-xs">
              Send a message, paste code, or share files. Everything syncs across your devices.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-1.5">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDate = !prev || formatDateLabel(prev.created_at) !== formatDateLabel(msg.created_at);
              const imageAttachments = msg.attachments?.filter((a) => a.mime_type.startsWith('image/')) || [];
              const fileAttachments = msg.attachments?.filter((a) => !a.mime_type.startsWith('image/')) || [];

              return (
                <div key={msg.id}>
                  {showDate && <DateDivider label={formatDateLabel(msg.created_at)} />}
                  <div className="flex justify-end group">
                    <div className="flex flex-col items-end gap-1.5 max-w-full">
                      {msg.message_type === 'code' && msg.content && (
                        <CodeMessage code={msg.content} language={msg.language} timestamp={msg.created_at} />
                      )}
                      {msg.message_type === 'normal' && msg.content && (
                        <div className="bg-emerald-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-xl shadow-sm">
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-emerald-100/70 mt-1 text-right">{formatTime(msg.created_at)}</p>
                        </div>
                      )}
                      {(msg.message_type === 'file' || msg.message_type === 'image') && msg.content && (
                        <div className="bg-emerald-500 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-xl shadow-sm">
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-emerald-100/70 mt-1 text-right">{formatTime(msg.created_at)}</p>
                        </div>
                      )}
                      {imageAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {imageAttachments.map((a) => (
                            <ImageAttachment key={a.id} attachment={a} timestamp={msg.created_at} onOpen={setViewer} />
                          ))}
                        </div>
                      )}
                      {fileAttachments.length > 0 && (
                        <div className="flex flex-col gap-2 items-end">
                          {fileAttachments.map((a) => (
                            <FileAttachmentCard key={a.id} attachment={a} timestamp={msg.created_at} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewer && <ImageViewer attachment={viewer} onClose={() => setViewer(null)} />}
    </>
  );
}
