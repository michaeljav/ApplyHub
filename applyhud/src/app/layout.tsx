import type { Metadata } from 'next';
import Providers from './Providers';
import 'antd/dist/reset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Selección IAD',
  description: 'Portal de selección y designación de profesionales y técnicos'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
