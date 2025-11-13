'use client';

import { Layout } from 'antd';
import { ReactNode } from 'react';
import Providers from '@/app/Providers';
import AppHeader from '@/components/AppHeader';

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
