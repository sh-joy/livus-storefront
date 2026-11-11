import { notFound } from 'next/navigation';
import DesignSystemClient from './DesignSystemClient';

// Internal design comparison page: never served on the live site (real 404 status).
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <DesignSystemClient />;
}
