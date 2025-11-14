'use client';

import { Layout } from 'antd';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import Providers from '@/app/Providers';

const AppHeader = dynamic(() => import('@/components/AppHeader'), {
  ssr: false
});

const { Content } = Layout;

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          {children}
        </Content>
      </Layout>
    </Providers>
  );
}
