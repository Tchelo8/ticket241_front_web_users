/**
 * Questions fréquentes de la page Aide : texte du site (comme les conditions de vente),
 * à tenir à jour avec ce que la plateforme fait réellement.
 */
export const FAQ_THEMES = ['Billets', 'Paiement', 'Annulation', 'Compte', 'Organisateurs'] as const;
export type FaqTheme = (typeof FAQ_THEMES)[number];

export type FaqEntry = { id: string; theme: FaqTheme; q: string; a: string };

export const FAQ: FaqEntry[] = [
  { id: 'billets-1', theme: 'Billets', q: 'Où trouver mes billets après l’achat ?', a: "Avec un compte : dans « Mes billets ». Sans compte : sur la page de votre commande, dont le lien s'affiche après l'achat. Si vous avez donné votre e-mail, vos billets vous sont aussi envoyés en PDF." },
  { id: 'billets-4', theme: 'Billets', q: 'Puis-je acheter sans créer de compte ?', a: "Oui. Indiquez simplement votre numéro (celui qui paiera par mobile money) et, si vous le souhaitez, votre e-mail. Jusqu'à 5 billets par commande sans compte." },
  { id: 'billets-5', theme: 'Billets', q: 'J’ai acheté sans compte et perdu le lien de ma commande.', a: "Ouvrez « Retrouver mes billets » et saisissez votre numéro : un code vous est envoyé à l'e-mail donné lors de l'achat. Il ouvre l'accès à vos billets payés pendant 30 minutes." },
  { id: 'billets-2', theme: 'Billets', q: 'Mon billet fonctionne-t-il sans connexion ?', a: 'Téléchargez le PDF de vos billets : il contient le QR code et fonctionne sans connexion le jour de l’événement.' },
  { id: 'billets-3', theme: 'Billets', q: 'Puis-je transférer un billet à quelqu’un ?', a: "Pas encore depuis le site. Contactez le support si vous ne pouvez plus vous rendre à l'événement." },
  { id: 'paiement-1', theme: 'Paiement', q: 'Quels moyens de paiement acceptez-vous ?', a: 'Airtel Money et Moov Money. Le paiement par carte Visa et Mastercard arrive prochainement.' },
  { id: 'paiement-2', theme: 'Paiement', q: 'Je n’ai pas reçu la demande de paiement sur mon téléphone.', a: "Vérifiez que le numéro saisi est bien celui de votre compte mobile money. Vous pouvez aussi composer *150# (Airtel) ou *555# (Moov) et valider depuis le menu. Sans validation dans le délai affiché, les places sont libérées et vous pouvez recommencer." },
  { id: 'paiement-3', theme: 'Paiement', q: 'J’ai été débité mais je n’ai pas de billet.', a: "Pas d'inquiétude : la confirmation peut prendre quelques minutes. Passé ce délai, contactez-nous avec la référence du SMS de votre opérateur." },
  { id: 'annulation-1', theme: 'Annulation', q: 'Comment annuler et être remboursé ?', a: "Les conditions d'annulation dépendent de l'événement (indiquées sur sa page). Contactez le support avec le numéro de votre billet." },
  { id: 'annulation-2', theme: 'Annulation', q: 'Que se passe-t-il si l’événement est annulé ou reporté ?', a: "En cas d'annulation, le support vous contacte pour le remboursement. En cas de report, votre billet reste valable pour la nouvelle date." },
  { id: 'compte-1', theme: 'Compte', q: 'J’ai changé de numéro de téléphone.', a: "Le changement de numéro n'est pas encore possible en ligne : contactez le support. Vos billets restent rattachés à votre compte." },
  { id: 'compte-2', theme: 'Compte', q: 'Comment supprimer mon compte ?', a: "Depuis votre profil, « Supprimer mon compte », avec votre mot de passe. Vos billets déjà payés restent valables ; pour réactiver le compte, contactez le support." },
  { id: 'organisateurs-1', theme: 'Organisateurs', q: 'Comment vendre des billets sur Ticket241 ?', a: 'Contactez-nous depuis la page Organisateurs. Après vérification de votre structure, vous publiez vos événements et encaissez en mobile money.' },
];

/** Question ouverte par défaut. */
export const FAQ_DEFAULT_OPEN = 'paiement-2';
