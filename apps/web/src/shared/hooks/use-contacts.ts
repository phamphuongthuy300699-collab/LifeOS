import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type Contact = {
  id: string;
  displayName: string;
  company: string | null;
  roleTitle: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  shortProfile: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateContactInput = {
  displayName: string;
  primaryEmail?: string;
  company?: string;
  roleTitle?: string;
};

const CONTACTS_MOCK_KEY = 'lifeos-contacts-mock-v1';

function readMock(): Contact[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(CONTACTS_MOCK_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Contact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMock(items: Contact[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTACTS_MOCK_KEY, JSON.stringify(items));
}

function makeId(): string {
  return `contact_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        return await apiFetch<{ items: Contact[] }>('/contacts');
      } catch {
        return { items: readMock() };
      }
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateContactInput) => {
      try {
        return await apiFetch<Contact>('/contacts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch {
        const created: Contact = {
          id: makeId(),
          displayName: payload.displayName,
          company: payload.company ?? null,
          roleTitle: payload.roleTitle ?? null,
          primaryEmail: payload.primaryEmail ?? null,
          primaryPhone: null,
          shortProfile: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        writeMock([created, ...readMock()]);
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
