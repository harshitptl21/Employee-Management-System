'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Employee } from '@/types';
import { initials, resolveImageUrl, getErrorMessage } from '@/lib/utils';

interface AvatarUploadProps {
  employee: Employee;
  canEdit: boolean;
  onUploaded: (employee: Employee) => void;
}

export function AvatarUpload({ employee, canEdit, onUploaded }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUrl = resolveImageUrl(employee.profileImageUrl, employee.updatedAt);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post<{ data: Employee }>(`/employees/${employee.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to upload photo.'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-14 w-14 shrink-0">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={employee.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 font-mono text-lg font-semibold text-brand-700 dark:bg-brand/15 dark:text-brand-400">
            {initials(employee.name)}
          </div>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-slate-600 shadow-card hover:bg-slate-50 disabled:opacity-50 dark:border-line-dark dark:bg-surface-dark dark:text-slate-400 dark:hover:bg-white/5"
          >
            {uploading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            ) : (
              <CameraIcon className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {canEdit && (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {error && <p className="max-w-[10rem] text-center text-[11px] text-signal-red">{error}</p>}
    </div>
  );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="14" r="3.2" />
    </svg>
  );
}
