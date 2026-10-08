export const FAQ_THEMES = ['Billets', 'Paiement', 'Annulation', 'Compte', 'Organisateurs'] as const;
export type FaqTheme = (typeof FAQ_THEMES)[number];

export type FaqEntry = { id: string; theme: FaqTheme; q: string; a: string };

export const FAQ: FaqEntry[] = [
  { id: 'billets-1', theme: 'Billets', q: 'Où trouver mes billets après l’achat ?', a: "Dans « Mes billets », sur le site comme dans l'application. Vous recevez aussi un SMS et un e-mail avec le lien vers votre billet et son QR code." },
  { id: 'billets-2', theme: 'Billets', q: 'Mon billet fonctionne-t-il sans connexion ?', a: "Oui. Une fois ouvert une première fois dans l'application, le QR code reste disponible hors ligne. Vous pouvez aussi télécharger le PDF." },
  { id: 'billets-3', theme: 'Billets', q: 'Puis-je transférer un billet à quelqu’un ?', a: "Oui, depuis le billet : « Transférer », puis saisissez le numéro du destinataire. Le billet d'origine est alors désactivé." },
  { id: 'paiement-1', theme: 'Paiement', q: 'Quels moyens de paiement acceptez-vous ?', a: 'Airtel Money et Moov Money. Le paiement par carte Visa et Mastercard arrive prochainement.' },
  { id: 'paiement-2', theme: 'Paiement', q: 'Je n’ai pas reçu la demande de paiement sur mon téléphone.', a: 'Vérifiez que le numéro saisi est bien celui de votre compte mobile money, puis touchez « Renvoyer la demande ». Vous pouvez aussi composer *150# (Airtel) ou *555# (Moov) et valider depuis le menu.' },
  { id: 'paiement-3', theme: 'Paiement', q: 'J’ai été débité mais je n’ai pas de billet.', a: "Pas d'inquiétude : la confirmation peut prendre jusqu'à 10 minutes. Passé ce délai, contactez-nous avec la référence du SMS de votre opérateur ; le billet est émis ou le montant remboursé sous 48 h." },
  { id: 'annulation-1', theme: 'Annulation', q: 'Comment annuler et être remboursé ?', a: "Depuis le billet, « Annuler », jusqu'à 48 heures avant l'événement. Le remboursement est intégral, sur le même compte mobile money, sous 72 heures." },
  { id: 'annulation-2', theme: 'Annulation', q: 'Que se passe-t-il si l’événement est annulé ou reporté ?', a: "En cas d'annulation, vous êtes remboursé automatiquement. En cas de report, votre billet reste valable pour la nouvelle date, ou vous pouvez demander le remboursement." },
  { id: 'compte-1', theme: 'Compte', q: 'J’ai changé de numéro de téléphone.', a: 'Dans Profil, modifiez votre numéro : un code de vérification est envoyé au nouveau numéro. Vos billets restent rattachés à votre compte.' },
  { id: 'organisateurs-1', theme: 'Organisateurs', q: 'Comment vendre des billets sur Ticket241 ?', a: 'Créez un compte organisateur depuis la page Organisateurs. Après vérification de votre structure, vous publiez vos événements et encaissez en mobile money.' },
];

/** Question ouverte par défaut (comme le prototype). */
export const FAQ_DEFAULT_OPEN = 'paiement-2';
