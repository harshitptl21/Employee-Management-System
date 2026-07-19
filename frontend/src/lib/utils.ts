import { clsx, type ClassValue } from 'clsx';
import { Role } from '@/types';
import { STATIC_BASE_URL } from './api';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Extracts a human-readable message from an API error. The backend's
 * validation middleware returns a generic top-level `message` ("Validation
 * failed") plus a `details` array of per-field problems — this surfaces
 * those specifics instead of just the generic message, so e.g. "phone:
 * Invalid phone number" shows up rather than a bare "Validation failed".
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const data = (err as { response?: { data?: { message?: string; details?: unknown } } })?.response?.data;
  if (!data) return fallback;

  if (Array.isArray(data.details) && data.details.length > 0) {
    const fieldMessages = data.details
      .map((d: any) => {
        const field = typeof d?.path === 'string' ? d.path.replace(/^body\./, '') : null;
        return field && d?.message ? `${field}: ${d.message}` : d?.message;
      })
      .filter(Boolean);
    if (fieldMessages.length > 0) return fieldMessages.join('; ');
  }

  return data.message ?? fallback;
}

/** Super Admin and HR Manager can access the employee directory, dashboard, and org chart. */
export function isPrivilegedRole(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'HR_MANAGER';
}

export function formatCurrency(value: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Resolves a stored profileImageUrl (either a full external URL or the
 * app's own relative `/uploads/<id>.png` path) into something an <img> tag
 * can load. `updatedAt` is appended as a cache-buster since re-uploads
 * overwrite the same filename — without it, browsers would keep showing
 * the stale cached image after a new upload.
 */
export function resolveImageUrl(path: string | null, updatedAt?: string): string | null {
  if (!path) return null;
  const base = /^https?:\/\//.test(path) ? path : `${STATIC_BASE_URL}${path}`;
  if (!updatedAt) return base;
  const version = new Date(updatedAt).getTime();
  return `${base}${base.includes('?') ? '&' : '?'}v=${version}`;
}
