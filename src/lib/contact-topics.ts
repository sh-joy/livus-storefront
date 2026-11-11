export const CONTACT_TOPICS = ['Order & delivery', 'Size & fit', 'Exchange & returns', 'Payment', 'Product question', 'Other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];
