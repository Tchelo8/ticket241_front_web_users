/** Coordonnées du support. À remplacer par les vraies valeurs avant la mise en production. */
export const SUPPORT = {
  email: 'aide@ticket241.ga',
  organizersEmail: 'organisateurs@ticket241.ga',
  /** Numéro WhatsApp au format international sans « + » (ex. 241XXXXXXXX). Vide : WhatsApp choisit le contact. */
  whatsapp: '',
  hours: 'Lun.–dim., 8 h – 22 h (heure de Libreville)',
};

export const whatsappUrl = (text = 'Bonjour, j’ai une question sur une commande Ticket241.') =>
  `https://wa.me/${SUPPORT.whatsapp}?text=${encodeURIComponent(text)}`;
