import { redirect } from 'next/navigation';

// Password reset lives inside the sign-in page (same design, same flow).
// Keep this URL working for old links and emails.
export default function ForgotPasswordPage() {
  redirect('/signin?mode=reset-request');
}
