export type MessageType = 'normal' | 'code' | 'image' | 'file';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  message_type: MessageType;
  content: string | null;
  language: string | null;
  created_at: string;
  attachments?: Attachment[];
}

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
}

export interface PendingFile {
  id: string;
  file: File;
  previewUrl?: string;
  isImage: boolean;
  progress: number;
  error?: string;
  storagePath?: string;
}
