/**
 * Documents légaux. Texte de démonstration, à faire valider par un juriste.
 * À terme : servis par un CMS ou des fichiers Markdown (src/content/legal/*.md).
 * Les liens s'écrivent en Markdown : [libellé](/chemin).
 */
export type LegalSection = { id: string; title: string; paragraphs: string[] };
export type LegalDocument = { title: string; lead: string; updated: string; sections: LegalSection[] };

export const CGV: LegalDocument = {
  title: 'Conditions générales de vente',
  lead: "L'essentiel en une phrase : vous payez en mobile money, votre billet arrive aussitôt, et vous pouvez annuler sans frais jusqu'à 48 heures avant l'événement.",
  updated: 'Mise à jour le 1er octobre 2026',
  sections: [
    { id: 'objet', title: 'Objet', paragraphs: ["Les présentes conditions régissent la vente de billets d'événements par Ticket241, plateforme de billetterie exploitée au Gabon, agissant en qualité d'intermédiaire entre l'acheteur et l'organisateur.", "Toute commande implique l'acceptation sans réserve des présentes conditions."] },
    { id: 'commande', title: 'Commande', paragraphs: ["La commande est passée sur le site ou l'application. L'acheteur choisit l'événement, le type et le nombre de billets, puis renseigne son nom et son numéro de téléphone.", "Le nombre de billets par commande peut être limité par l'organisateur."] },
    { id: 'prix', title: 'Prix et paiement', paragraphs: ['Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises. Les frais de service éventuels sont affichés avant validation.', "Le paiement s'effectue par Airtel Money ou Moov Money. La commande n'est définitive qu'après confirmation du paiement par l'opérateur."] },
    { id: 'billets', title: 'Billets', paragraphs: ['Chaque billet porte un QR code unique, valable pour une seule entrée. Toute reproduction ou revente non autorisée entraîne son annulation.', "Le billet est nominatif lorsque l'organisateur l'exige ; une pièce d'identité peut alors être demandée à l'entrée."] },
    { id: 'annulation', title: 'Annulation et remboursement', paragraphs: ["L'acheteur peut annuler sa commande sans frais jusqu'à 48 heures avant le début de l'événement. Le remboursement est intégral, sur le compte mobile money utilisé, sous 72 heures.", "En cas d'annulation de l'événement par l'organisateur, le remboursement est automatique. En cas de report, le billet reste valable pour la nouvelle date."] },
    { id: 'responsabilite', title: 'Responsabilité', paragraphs: ["L'organisateur est seul responsable du déroulement de l'événement. Ticket241 ne saurait être tenu responsable d'une modification de programme, d'horaire ou de lieu décidée par l'organisateur."] },
    { id: 'donnees', title: 'Données personnelles', paragraphs: ['Les données collectées lors de la commande sont traitées conformément à notre [politique de confidentialité](/confidentialite).'] },
    { id: 'litiges', title: 'Droit applicable et litiges', paragraphs: ['Les présentes conditions sont soumises au droit gabonais. En cas de litige, une solution amiable sera recherchée avant toute action devant les juridictions compétentes de Libreville.'] },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Politique de confidentialité',
  lead: 'Nous collectons le strict nécessaire pour vous envoyer vos billets, et rien n’est revendu.',
  updated: 'Mise à jour le 1er octobre 2026',
  sections: [
    { id: 'collecte', title: 'Données collectées', paragraphs: ["Nom, numéro de téléphone, adresse e-mail, historique d'achats et préférences (ville, favoris). Nous ne conservons aucune donnée de paiement : celles-ci restent chez votre opérateur mobile money."] },
    { id: 'usage', title: 'Utilisation', paragraphs: ["Émettre et envoyer vos billets, traiter vos paiements et remboursements, vous prévenir des changements d'un événement, et — si vous l'acceptez — vous recommander des événements."] },
    { id: 'partage', title: 'Partage', paragraphs: ["L'organisateur d'un événement reçoit le nom des acheteurs pour le contrôle d'accès. Aucune donnée n'est vendue à des tiers."] },
    { id: 'conservation', title: 'Conservation', paragraphs: ['Les données de compte sont conservées tant que le compte est actif, puis trois ans après la dernière activité. Les justificatifs de vente sont conservés selon les obligations légales.'] },
    { id: 'droits', title: 'Vos droits', paragraphs: ['Vous pouvez consulter, corriger ou supprimer vos données depuis votre profil, ou en écrivant à confidentialite@ticket241.ga.'] },
    { id: 'cookies', title: 'Cookies', paragraphs: ["Le site utilise des cookies nécessaires à la connexion et au panier, et des mesures d'audience anonymes. Vous pouvez les refuser depuis le bandeau prévu à cet effet."] },
  ],
};
