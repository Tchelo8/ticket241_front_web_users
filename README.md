# Ticket241 Web

Billetterie publique de **Ticket241** (Gabon) : découvrir, acheter, mes billets.
Recréation React du prototype `Ticket241 Web.dc.html` (passation de design).

## Stack

Vite · React 18 · TypeScript · React Router · CSS Modules (jetons en variables CSS) ·
@phosphor-icons/react (duotone) · TanStack Query · Zustand · qrcode.react · lottie-react.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # vérification TypeScript + build de production
```

Par défaut, l'app tourne sur les **données de démonstration** (`src/mocks/`).
Pour brancher l'API : `VITE_USE_MOCKS=false VITE_API_URL=https://… npm run dev`
(les appels sont regroupés dans `src/api/client.ts`).

En démonstration, n'importe quel numéro (8 chiffres minimum) et mot de passe permettent de se connecter ;
un paiement est confirmé environ 5 s après la demande.

## Organisation

| Dossier | Contenu |
| --- | --- |
| `src/styles/` | Jetons (`tokens.css`, thèmes Papier / Encre / Noir & Blanc), styles et animations globaux |
| `src/components/` | `SiteHeader`, `NavLink`, `CityMenu`, `ThemeSwitch`, `Dateline`, `SectionHeader`, `EventCard`, `FeatureCard`, `TrendRow`, `FavButton`, `Chip`, `RemovableChip`, `Toggle`, `QtyStepper`, `TextField`, `PaymentMethodCard`, `PayButton`, `UssdWaiting`, `TicketCard`, `EmptyState`, `CornerMarks` |
| `src/pages/` | Un écran par route |
| `src/store/` | État global Zustand : thème, ville, favoris (localStorage), panier (sessionStorage), paiement, session |
| `src/api/` | Accès aux données + hooks TanStack Query (statut de paiement interrogé toutes les 3 s) |
| `src/mocks/` | Les neuf événements, les villes, les billets de démonstration |

## Routes

`/` · `/explorer` (filtres dans l'URL : `?cat=Concert&max=10000&quand=Septembre&tri=prix&remb=1&q=jazz`) ·
`/evenements/:id` · `/paiement` → `/paiement/attente` → `/paiement/confirme` · `/billets` (`?onglet=passes`) ·
`/billets/:ref` · `/favoris` · `/connexion` · `/inscription` · `/profil`.

Les routes de paiement, de billets et le profil redirigent vers `/connexion?retour=…` si l'utilisateur n'est pas connecté.
