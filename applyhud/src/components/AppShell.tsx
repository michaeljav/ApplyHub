'use client';

import { Layout, ConfigProvider } from 'antd';
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
      <ConfigProvider
        theme={{
          token: {
            fontSize: 18, // 👈 fuente global un poco más grande
            borderRadius: 8, // 👈 bordes más modernos
            controlHeight: 40 // 👈 altura de inputs / selects / botones
          }
        }}
      >
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
          <AppHeader />
          <Content style={{ padding: '24px', background: '#f5f5f5' }}>
            {children}
          </Content>
        </Layout>
      </ConfigProvider>
    </Providers>
  );
}
