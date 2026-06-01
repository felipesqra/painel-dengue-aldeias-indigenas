import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard SASI',
  description: 'Hackathon: Dengue vs Saneamento nas Aldeias Indígenas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
