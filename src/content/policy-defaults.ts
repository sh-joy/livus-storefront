/**
 * Default text for the legal / help pages (Privacy, Terms, Shipping & Returns).
 * Written in the RichText format (see src/components/storefront/RichText.tsx):
 * blank line = new paragraph, **bold**, "- " bullets, leading "Label:" is bolded automatically.
 *
 * Used as the fallback when nothing has been saved in Admin → Pages & Text.
 * Store details (email, phone, base delivery fee) are filled in from Admin settings at render time.
 * Promotions such as free delivery are deliberately NOT written here: offers change, policies don't.
 *
 * NOTE for the owner: this is a solid, plain-language starting point based on how
 * Bangladeshi fashion e-commerce brands handle these topics. It is not legal advice;
 * have it reviewed before you rely on it.
 */

export const POLICY_LAST_UPDATED = '11 November 2026';

export type PolicyContext = {
  storeName?: string;
  supportEmail?: string;
  supportPhone?: string;
  /** Lowest delivery charge in BDT (Admin → Settings → default delivery fee). */
  deliveryFeeBdt?: number;
  /** Accepted for compatibility but intentionally unused: offers are not written into policies. */
  freeDeliveryOverBdt?: number;
};

const taka = (n: number) => `৳${n.toLocaleString('en-US')}`;

function contactLines(c: PolicyContext): string {
  const lines = [
    c.supportEmail ? `- **Email:** ${c.supportEmail}` : '',
    c.supportPhone ? `- **Phone / WhatsApp:** ${c.supportPhone}` : '',
    '- **Contact form:** the Contact page on this website',
    '- **Hours:** Saturday to Thursday, 10 AM – 8 PM',
  ].filter(Boolean);
  return lines.join('\n');
}

export function privacyPolicyText(c: PolicyContext = {}): string {
  const name = c.storeName || 'LIVUS';
  return [
    `Last updated: ${POLICY_LAST_UPDATED}`,

    `This policy explains what personal information ${name} ("we", "us") collects when you visit our website or shop with us, how we use it, who we share it with, and the choices you have. By using our website you agree to this policy.`,

    '**1. Information we collect**',
    [
      '- **Details you give us:** your name, phone number, email address, delivery address and any delivery instructions when you place an order, create an account, subscribe to our newsletter or contact us.',
      '- **Order details:** the products, sizes and quantities you order, order numbers, delivery status and order history.',
      '- **Payment details:** for Cash on Delivery we do not collect any payment information. For bKash or Nagad we collect the Transaction ID (TrxID) and the number you sent the money from, so we can confirm your payment. We never ask for or store your PIN, OTP or card details.',
      '- **Account details:** if you create an account, your login email and a securely hashed password. If you sign in with Google or Facebook, we receive your name, email address and profile picture from them.',
      '- **Device and usage information:** your IP address, browser and device type, pages you view and actions such as adding items to your cart, collected through cookies and similar technologies.',
    ].join('\n'),

    '**2. How we use your information**',
    [
      '- To process, confirm (including by phone) and deliver your orders, and to handle exchanges and refunds.',
      '- To verify bKash and Nagad payments and prevent fraud.',
      '- To send you order confirmations, delivery updates and account emails such as verification codes.',
      '- To answer your questions and messages.',
      '- To send you news, new drops and offers, but only if you agreed to receive them. You can unsubscribe at any time using the link in our emails or by contacting us.',
      '- To understand how our website is used and to improve it, and to measure and improve our advertising.',
      '- To meet our legal, tax and accounting obligations.',
    ].join('\n'),

    '**3. Checkout autosave**',
    'While you fill in the checkout form, we save your details so you can finish your order later and so our team can help if you do not complete it. Your cart is also kept in your browser so it is still there when you come back.',

    '**4. Who we share your information with**',
    'We do not sell or rent your personal information. We share only what is needed with:',
    [
      '- **Delivery partners:** your name, phone number and address so they can deliver your order.',
      '- **Payment providers:** bKash and Nagad, only as part of verifying the payment you made to us.',
      '- **Service providers** who run parts of our website for us, such as website hosting and database providers, our email delivery service, and sign-in providers (Google, Facebook).',
      '- **Advertising and analytics partners** such as Meta (Facebook and Instagram) and Google, who receive information about your visits and purchases through cookies and pixels to measure and show relevant ads.',
      '- **Authorities**, when the law requires it or to protect our rights, customers or the public.',
    ].join('\n'),

    '**5. Cookies and tracking**',
    'We use cookies and similar technologies to keep you signed in, remember your cart, understand how the website is used, and measure our advertising (for example the Meta Pixel and Google Analytics). You can block or delete cookies in your browser settings; some parts of the website, such as signing in or checkout, may not work properly without them.',

    '**6. How long we keep your information**',
    'We keep order and payment records for as long as needed for delivery, exchanges, accounting and legal purposes. Account information is kept while your account is active. Newsletter details are kept until you unsubscribe. When information is no longer needed, we delete or anonymise it.',

    '**7. How we protect your information**',
    'Our website uses encrypted (HTTPS) connections, passwords are stored in hashed form, and only authorised team members can access customer and order information. No system is completely secure, but we work to protect your information and will act quickly if anything goes wrong.',

    '**8. Your choices and rights**',
    [
      '- See or update the details in your account from the My Account page.',
      '- Ask us for a copy of the information we hold about you, or ask us to correct or delete it, unless we must keep it for legal or accounting reasons.',
      '- Unsubscribe from marketing emails at any time.',
      '- Control cookies through your browser settings.',
    ].join('\n'),

    '**9. Children**',
    `Our website is not intended for children under 13, and we do not knowingly collect their personal information. If you believe a child has given us information, contact us and we will delete it.`,

    '**10. Changes to this policy**',
    'We may update this policy from time to time. The "Last updated" date at the top shows when it last changed. Significant changes will be shown on this page.',

    '**11. Contact us**',
    `For any questions about this policy or your information, contact ${name}:`,
    contactLines(c),
  ].join('\n\n');
}

export function termsText(c: PolicyContext = {}): string {
  const name = c.storeName || 'LIVUS';
  return [
    `Last updated: ${POLICY_LAST_UPDATED}`,

    `These terms apply to your use of the ${name} website and to every order you place with us. By using the website or placing an order, you agree to them. Please read them together with our Privacy Policy and our Shipping & Returns policy.`,

    '**1. About us**',
    `${name} is a Bangladeshi sportswear and streetwear brand. We sell our products online to customers in Bangladesh.`,

    '**2. Your account**',
    'You can shop as a guest or create an account. If you create an account, keep your login details private; you are responsible for activity on your account. Give us accurate details, and tell us if you think someone else has used your account.',

    '**3. Placing an order**',
    [
      '- When you confirm an order you make an offer to buy the products in your cart. You will see an order number on the confirmation page.',
      '- Our team may call you to confirm the order before it is dispatched. If we cannot reach you after reasonable attempts, the order may be cancelled.',
      '- An order is accepted when we dispatch it. We may refuse or cancel an order, for example if a product is out of stock, a price was shown incorrectly, a payment cannot be verified, or we suspect fraud. If you already paid, we refund you in full.',
    ].join('\n'),

    '**4. Prices, VAT and delivery charges**',
    [
      '- All prices are in Bangladeshi Taka (BDT).',
      '- VAT and the delivery charge are shown separately at checkout before you confirm, and are included in the order total.',
      '- Prices and offers can change at any time, but the price you see when you confirm is the price you pay for that order.',
    ].filter(Boolean).join('\n'),

    '**5. Payment**',
    [
      '- **Cash on Delivery:** pay the courier the full order total when your order arrives. Please check the parcel before paying.',
      '- **bKash / Nagad (when available):** send the exact order total to the number shown at checkout using Send Money, then enter the Transaction ID (TrxID). We dispatch the order after we have verified the payment. Orders with a payment we cannot verify may be cancelled.',
      '- Never share your PIN or OTP with anyone. Our team will never ask for them.',
    ].join('\n'),

    '**6. Promo codes and gift codes**',
    'Codes can be used only as described when they are issued, cannot be exchanged for cash, and may have a minimum order value, an expiry date or a limit on uses. One code can be used per order. We may cancel orders that misuse codes.',

    '**7. Delivery**',
    'We deliver across Bangladesh through courier partners. Delivery times shown on the website are estimates and can be affected by holidays, weather or high order volume. See our Shipping & Returns policy for details.',

    '**8. Cancellations**',
    'You can ask to cancel an order before it is dispatched by contacting us with your order number. Once an order has been dispatched it cannot be cancelled, but you may be able to exchange it under our Shipping & Returns policy. Repeatedly refusing Cash on Delivery orders at the door may mean we ask for advance payment on future orders.',

    '**9. Exchanges and refunds**',
    'Exchanges and refunds are handled under our Shipping & Returns policy, which forms part of these terms.',

    '**10. Product information**',
    'We do our best to show products accurately. Colours can look slightly different on different screens, and measurements in the size guide may vary slightly. If something you receive is not as described, contact us under our Shipping & Returns policy.',

    '**11. Intellectual property**',
    `All content on this website, including the ${name} name and logo, designs, photos and text, belongs to ${name} or is used with permission. You may not copy, reproduce or use it for commercial purposes without our written permission.`,

    '**12. Using our website**',
    'Do not misuse the website: no attempts to break in, overload it, scrape it, or place fake or fraudulent orders. We may suspend accounts or block access if these terms are broken.',

    '**13. Limitation of liability**',
    `Nothing in these terms limits your rights as a consumer under the laws of Bangladesh. Otherwise, ${name} is not responsible for losses that were not reasonably foreseeable, or for delays or failures caused by events outside our reasonable control. Our total responsibility for any order is limited to the amount you paid for that order.`,

    '**14. Governing law**',
    'These terms are governed by the laws of the People\'s Republic of Bangladesh, and any disputes will be handled by the courts of Dhaka, Bangladesh.',

    '**15. Changes to these terms**',
    'We may update these terms from time to time. The version on this page when you place an order applies to that order.',

    '**16. Contact us**',
    contactLines(c),
  ].join('\n\n');
}

export function shippingReturnsText(c: PolicyContext = {}): string {
  const fee = c.deliveryFeeBdt && c.deliveryFeeBdt > 0 ? c.deliveryFeeBdt : 0;
  return [
    `Last updated: ${POLICY_LAST_UPDATED}`,

    'Here is everything you need to know about how we deliver your order and how exchanges and refunds work.',

    '**Delivery**',
    [
      '- **Where we deliver:** everywhere in Bangladesh, through our courier partners.',
      '- **Delivery time:** usually 2–3 working days inside Dhaka and 3–5 working days for the rest of Bangladesh, after your order is confirmed. Holidays, weather and sale periods can add a few days.',
      fee
        ? `- **Delivery charge:** from ${taka(fee)}, depending on your district. The exact charge is shown at checkout before you confirm.`
        : '- **Delivery charge:** depends on your district and is shown at checkout before you confirm.',
      '- **Order confirmation:** our team may call you to confirm your order before dispatch. Please keep your phone reachable.',
      '- **Tracking:** enter your order number (for example LIV-123456) on the My Account page to see your order status. The courier may also contact you on the day of delivery.',
    ].filter(Boolean).join('\n'),

    '**When your parcel arrives**',
    'Please check the parcel in front of the delivery person before paying. If the package is damaged, opened or the wrong item is inside, tell the delivery person and contact us the same day. We recommend recording a short video while opening the parcel — it helps us resolve any problem quickly.',

    '**Exchanges (size or fit)**',
    [
      '- You can exchange an item for a different size within **7 days of delivery**.',
      '- The item must be unworn, unwashed and undamaged, with all original tags and packaging.',
      '- Contact us with your order number and the size you need. If the new size is out of stock, you can choose another item or ask for a refund.',
      '- For size exchanges, you pay the delivery charge for sending the new item. Exchanges for our mistakes are free.',
    ].join('\n'),

    '**Wrong, faulty or damaged items**',
    'If you receive the wrong item, or an item with a manufacturing fault or damage, contact us within **48 hours of delivery** with your order number and photos (and the unboxing video if you have one). We will replace it at no cost, or refund you if a replacement is not available, and we cover the delivery both ways.',

    '**Items we cannot exchange**',
    [
      '- Items that have been worn, washed, altered or damaged after delivery.',
      '- Items without their original tags or packaging.',
      '- Underwear, socks and accessories that have been opened, for hygiene reasons (unless faulty).',
      '- Items bought on final sale, when this is stated on the product page.',
    ].join('\n'),

    '**Refunds**',
    [
      '- We refund when an item is faulty or wrong and cannot be replaced, when an order is cancelled before dispatch after you have paid, or when we cannot fulfil your order.',
      '- Refunds are sent to your bKash or Nagad number (or bank account for larger amounts) within **7–10 working days** after we approve the refund or receive the returned item.',
      '- For Cash on Delivery orders, we refund the product price; the original delivery charge is refunded only if the problem was our mistake.',
      '- We do not offer refunds for change of mind, but you can exchange the size under the rules above.',
    ].join('\n'),

    '**Refusing a delivery**',
    'If you no longer want an order, please cancel it before it is dispatched. Refusing a Cash on Delivery parcel at the door costs us the delivery both ways; repeated refusals may mean we ask for advance payment on future orders.',

    '**How to request an exchange or refund**',
    'Send us your order number, the item and the reason, with photos if it is faulty or wrong:',
    contactLines(c),
  ].filter(Boolean).join('\n\n');
}

export function cookiesPolicyText(c: PolicyContext = {}): string {
  const name = c.storeName || 'LIVUS';
  return [
    `Last updated: ${POLICY_LAST_UPDATED}`,

    `This policy explains how ${name} uses cookies and similar technologies on our website, what they do, and how you can control them. Read it together with our Privacy Policy.`,

    '**1. What cookies are**',
    'Cookies are small text files that a website saves in your browser. Similar technologies include local storage (data saved in your browser) and pixels (tiny pieces of code that tell a service a page was viewed). In this policy we call all of these "cookies".',

    '**2. Cookies we use**',
    [
      '- **Strictly necessary:** keep you signed in, keep the admin area secure, remember what is in your cart and protect forms from abuse. The website cannot work properly without these, so they cannot be switched off.',
      '- **Functional:** remember your choices, for example that you closed an offer popup, your saved checkout details and the products you recently viewed, so we can show relevant suggestions.',
      '- **Analytics:** help us understand how visitors use the website — which pages are visited, how people find us and where they leave — so we can improve it (for example Google Analytics).',
      '- **Advertising:** measure how well our ads work and show you relevant LIVUS ads on other websites and apps (for example the Meta Pixel for Facebook and Instagram, and Google advertising tags). They record events such as viewing a product, adding to cart, starting checkout and placing an order.',
    ].join('\n'),

    '**3. Cookies set by other companies**',
    'Some cookies are set by the services we use, such as Google (analytics and Google sign-in), Meta (Facebook and Instagram pixel and Facebook sign-in) and our website hosting provider. These companies handle the information under their own privacy policies.',

    '**4. How long cookies last**',
    [
      '- **Session cookies** are deleted when you close your browser.',
      '- **Persistent cookies** stay for a set time, from a few days (for example your sign-in) up to around two years for some analytics and advertising cookies, unless you delete them sooner.',
      '- Your cart and saved checkout details stay in your browser until you clear them or complete your order.',
    ].join('\n'),

    '**5. How to control cookies**',
    [
      '- Most browsers let you see, block and delete cookies in their settings (for example Chrome: Settings → Privacy and security → Cookies; Safari: Settings → Safari → Advanced). Blocking all cookies may stop sign-in, the cart or checkout from working.',
      '- To limit advertising, you can change your ad settings in your Facebook / Instagram and Google accounts, and turn on "Limit ad tracking" or "Delete advertising ID" on your phone.',
      '- To opt out of Google Analytics on all websites, you can install the Google Analytics opt-out browser add-on.',
    ].join('\n'),

    '**6. Changes to this policy**',
    'We may update this policy when we add or change the tools we use. The "Last updated" date at the top shows when it last changed.',

    '**7. Contact us**',
    contactLines(c),
  ].join('\n\n');
}
