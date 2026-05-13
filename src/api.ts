import type { ExternalLinks } from './types';

export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRFToken'] = getCsrfToken();
  }
  return fetch(url, { ...options, headers });
}

export const defaultLinks: ExternalLinks = {
  telegramOrder: 'https://web.telegram.org/k/#@kalradiaWarBand',
  telegramPublic: 'https://web.telegram.org/k/#@kalradiaWarBand',
  vkCommunity: 'https://vk.com/calradia_band',
  vkMessages: 'https://vk.com/im/convo/-234061306?entrypoint=community_page&tab=all',
  yandexForm: '',
};
