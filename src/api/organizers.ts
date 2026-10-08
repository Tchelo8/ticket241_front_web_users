/**
 * Organisateurs et abonnements.
 *   GET    /organizers            → Organizer[]
 *   GET    /me/following          → string[] (identifiants suivis)
 *   POST   /organizers/:id/follow
 *   DELETE /organizers/:id/follow
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { USE_MOCKS } from '../lib/clock';
import { ORGANIZERS, SEED_FOLLOWED, type Organizer } from '../mocks/organizers';
import { useAuth } from '../store/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const FOLLOW_KEY = 't241.mock.following';

const http = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(API_URL + path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
};

const readFollowed = (): string[] => {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    return raw ? (JSON.parse(raw) as string[]) : SEED_FOLLOWED;
  } catch {
    return SEED_FOLLOWED;
  }
};
const writeFollowed = (ids: string[]) => {
  try {
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(ids));
  } catch {
    /* stockage indisponible */
  }
};

/** Latence simulée (mise à 0 dans les tests). */
export const organizersMock = { latency: 150, failNext: false };
const wait = () => new Promise((r) => setTimeout(r, organizersMock.latency));

export const organizersApi = {
  async list(): Promise<Organizer[]> {
    if (!USE_MOCKS) return http('/organizers');
    await wait();
    return ORGANIZERS;
  },
  async following(): Promise<string[]> {
    if (!USE_MOCKS) return http('/me/following');
    await wait();
    return readFollowed();
  },
  async setFollow(id: string, follow: boolean): Promise<void> {
    if (!USE_MOCKS) return http(`/organizers/${encodeURIComponent(id)}/follow`, { method: follow ? 'POST' : 'DELETE' });
    await wait();
    if (organizersMock.failNext) {
      organizersMock.failNext = false;
      throw new Error('Échec simulé');
    }
    const ids = readFollowed().filter((x) => x !== id);
    writeFollowed(follow ? [...ids, id] : ids);
  },
};

export const useOrganizers = () => useQuery({ queryKey: ['organizers'], queryFn: organizersApi.list, staleTime: 60_000 });

export const useFollowing = () => {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ['following', !!user],
    queryFn: organizersApi.following,
    // Invité : aucun abonnement.
    enabled: !!user,
    placeholderData: [],
  });
};

/** Suivre / ne plus suivre, avec mise à jour optimiste. Invité → connexion. */
export function useToggleFollow() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const key = ['following', true];

  const mutation = useMutation({
    mutationFn: ({ id, follow }: { id: string; follow: boolean }) => organizersApi.setFollow(id, follow),
    onMutate: async ({ id, follow }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(key, follow ? [...previous.filter((x) => x !== id), id] : previous.filter((x) => x !== id));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return (id: string, currentlyFollowing: boolean) => {
    if (!user) {
      navigate(`/connexion?retour=${encodeURIComponent(pathname + search)}`);
      return;
    }
    mutation.mutate({ id, follow: !currentlyFollowing });
  };
}
