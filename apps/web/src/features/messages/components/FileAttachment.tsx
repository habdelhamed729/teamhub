import React from 'react';
import { FileText, FileImage, File as FileIcon } from 'lucide-react';
import type { Attachment } from '@teamhub/shared';

interface FileAttachmentProps {
  attachment: Attachment;
  /** Whether this is inside the current user's (own) message bubble */
  isOwn?: boolean;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1]!.toLowerCase() : '';
};

const getFileTypeIcon = (mimeType: string, ext: string) => {
  if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-emerald-400" />;
  if (mimeType.includes('pdf')) return <FileIcon className="w-5 h-5 text-rose-400" />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-400" />;
  return <FileIcon className="w-5 h-5 text-slate-400" />;
};

const getFileTypeLabel = (mimeType: string, ext: string): string => {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || ext === 'doc' || ext === 'docx') return 'DOC';
  if (mimeType.startsWith('image/')) return ext.toUpperCase();
  return ext.toUpperCase() || 'FILE';
};

/* ─── Component ────────────────────────────────────────────────────────────── */

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachment,
  isOwn = false,
}) => {
  const ext = getFileExtension(attachment.file_name);
  const typeLabel = getFileTypeLabel(attachment.file_type, ext);
  const isImage = attachment.file_type.startsWith('image/');

  const bgClass = isOwn ? 'bg-[#317268]' : 'bg-[#B8B9BA]';

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg overflow-hidden w-full ${bgClass} transition-opacity hover:opacity-90`}
    >
      {/* Image thumbnail area */}
      {isImage && (
        <div className="w-full h-[100px] overflow-hidden">
          <img
            src={attachment.url}
            alt={attachment.file_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* File info bar */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* File type icon badge */}
        <div className="flex flex-col items-center justify-center w-8 h-[42px] relative">
          {getFileTypeIcon(attachment.file_type, ext)}
          <span className="text-[10px] font-semibold text-white mt-0.5">
            {typeLabel.toLowerCase()}
          </span>
        </div>

        {/* File name + metadata */}
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-base text-white font-normal truncate leading-normal font-[Roboto]">
            {attachment.file_name}
          </p>
          <p className={`text-xs font-normal leading-normal font-[Roboto] ${isOwn ? 'text-[#9FA1A5]' : 'text-[#8C8F92]'}`}>
            {typeLabel} · {formatFileSize(attachment.file_size)}
          </p>
        </div>
      </div>
    </a>
  );
};
