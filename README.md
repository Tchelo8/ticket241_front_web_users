# Ticket241 Web

Billetterie publique de **Ticket241** (Gabon) : découvrir, acheter (avec ou sans compte), mes billets.

## Stack

Vite · React 18 · TypeScript · React Router · CSS Modules (jetons en variables CSS) ·
@phosphor-icons/react (duotone) · TanStack Query · Zustand · qrcode.react · lottie-react.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # vérification TypeScript + build de production
npm test           # tests Vitest + Testing Library
```

**Toutes les données viennent de l'API** (via la Gateway Ticket241) : il n'y a pas de données de démonstration.
Démarrez les services (script `ticket241-scripts/start-ticket241`), copiez `.env.example` en `.env`, puis `npm run dev`.

```bash
VITE_API_URL=/api                       # en dev : relayé par le proxy Vite
VITE_API_PROXY=http://localhost:8080    # la Gateway
```

### Service API

Tous les appels au serveur passent par **`src/api/apiService.ts`** :

- `API_BASE_URL` : l'adresse centrale de l'API, utilisée par chaque appel ;
- `ENDPOINTS` : toutes les routes au même endroit ;
- `request()` : la seule fonction qui appelle `fetch` (JWT de la session, JSON ou PDF, erreurs `ApiError`) ;
- `apiService` : les opérations par domaine — `events`, `cities`, `organizers`, `orders` (réservation et paiement,
  avec ou sans compte), `tickets`, `guestAccess` (billets retrouvés par code), `auth`, `preferences`, `signup`.

Les réponses de l'API sont converties en modèles du front dans `eventAdapter.ts` et `ticketAdapter.ts` ;
`src/api/hooks.ts` expose les hooks TanStack Query construits sur `apiService`.

### Achat

1. Le panier peut mélanger plusieurs catégories : il part dans **une seule commande** (`/tickets/reserve`, ou
   `/tickets/guest/reserve` sans compte), payée en une fois.
2. Les places sont confirmées de façon asynchrone : la commande est relue jusqu'à ce que ses billets soient réservés.
3. Le paiement Mobile Money est demandé, puis la page d'attente suit la commande jusqu'au paiement.

Sans compte, la réservation renvoie un **jeton de commande** (gardé sur l'appareil et dans le lien
`/commande/:id#jeton`, après « # » pour ne jamais être envoyé aux serveurs). Lien perdu : `/retrouver-mes-billets`
(code envoyé à l'e-mail d'un achat payé).

## Organisation

| Dossier | Contenu |
| --- | --- |
| `src/styles/` | Jetons (`tokens.css`, thèmes Papier / Encre / Noir & Blanc), styles et animations globaux |
| `src/components/` | En-tête, cartes d'événement, de billet (`TicketCard`, `TicketPass` avec QR code et PDF), d'organisateur, champs, boutons… |
| `src/pages/` | Un écran par route |
| `src/store/` | État global Zustand : thème, ville, favoris (localStorage), panier, paiement en cours, commandes sans compte, session |
| `src/api/` | `apiService.ts` (transmission, `API_BASE_URL`), adaptateurs, `types.ts`, `hooks.ts` (TanStack Query) |
| `src/content/` | FAQ, conditions de vente et politique de confidentialité (textes du site) |
| `src/config/support.ts` | Coordonnées du support (numéro WhatsApp à renseigner) |

## Routes

`/` · `/explorer` (filtres dans l'URL : `?cat=Concert&max=10000&quand=Ce%20mois-ci&tri=prix&remb=1&q=jazz&organisateur=3`) ·
`/evenements/:id` · `/paiement` → `/paiement/attente` → `/paiement/confirme` · `/billets` (`?onglet=passes`) ·
`/billets/:ref` · `/commande/:orderId#jeton` · `/retrouver-mes-billets` · `/favoris` · `/connexion` ·
`/inscription` → `/inscription/verification` · `/profil` · `/organisateurs` (`?type=Sport&q=bar`) ·
`/aide` (`?theme=Paiement&q=débité`) · `/conditions-de-vente` · `/confidentialite`.

Le paiement et « Mes billets » sont accessibles sans compte ; le détail d'un billet du compte (`/billets/:ref`) et
le profil redirigent vers `/connexion?retour=…`.

## Avant la mise en production

- Faire valider les textes légaux par un juriste, puis retirer l'encadré « Texte de démonstration ».
- Renseigner le numéro WhatsApp du support dans `src/config/support.ts`.
- Le paiement réel dépend du payment-service (pas encore développé) : sans lui, une demande de paiement
  reste en attente puis expire.
