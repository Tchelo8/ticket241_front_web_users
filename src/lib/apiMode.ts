/**
 * Choix, domaine par domaine, entre l'API réelle et le faux serveur.
 *
 * - VITE_USE_MOCKS=false        : tout passe par l'API réelle ;
 * - VITE_LIVE_API=auth,events   : seuls les domaines listés passent par l'API réelle,
 *                                 les autres restent sur le faux serveur (branchement progressif).
 */
export type ApiDomain = 'events' | 'cities' | 'tickets' | 'payments' | 'auth' | 'signup' | 'organizers';

const ALL_LIVE = import.meta.env.VITE_USE_MOCKS === 'false';
const LIVE = new Set(
  String(import.meta.env.VITE_LIVE_API ?? '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean),
);

/** Le domaine est-il branché sur l'API réelle ? */
export const isLive = (domain: ApiDomain) => ALL_LIVE || LIVE.has(domain);
