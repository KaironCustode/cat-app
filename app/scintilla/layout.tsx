import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scintilla',
  description: 'Il tuo compagno per smettere di fumare',
};

export default function ScintillaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
