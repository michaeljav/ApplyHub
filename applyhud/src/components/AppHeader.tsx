'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Layout, Menu, Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import logo from '@/img/logo.png';

const { Header } = Layout;

type AppUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  rol?: string | null;
};

const ALLOWED_ROLES = new Set(['ADMIN', 'RRHH']);

export default function AppHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAuthenticated = status === 'authenticated';
  const appUser = (session?.user ?? null) as AppUser | null;
  const canSeeHr = Boolean(appUser?.rol && ALLOWED_ROLES.has(appUser.rol));

  const navigationItems = useMemo<MenuProps['items']>(() => {
    if (!isAuthenticated) return [];

    const items: MenuProps['items'] = [
      {
        key: 'vacantes',
        label: <Link href="/vacantes">Vacantes</Link>
      }
    ];

    if (canSeeHr) {
      items.push({
        key: 'rrhh',
        label: <Link href="/admin/vacantes">Recursos Humanos</Link>
      });
    }

    return items;
  }, [isAuthenticated, canSeeHr]);

  const selectedKey = useMemo(() => {
    if (!isAuthenticated || !pathname) return '';
    if (pathname.startsWith('/admin')) return canSeeHr ? 'rrhh' : '';
    if (pathname.startsWith('/vacantes')) return 'vacantes';
    return '';
  }, [isAuthenticated, pathname, canSeeHr]);

  const handleLogout = () => {
    signOut({ callbackUrl: '/vacantes' });
  };

  const dropdownMenu: MenuProps = {
    items: [
      {
        key: 'logout',
        label: 'Cerrar sesión',
        icon: <LogoutOutlined />
      }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        handleLogout();
      }
    }
  };

  if (!isAuthenticated || !appUser) {
    return null;
  }

  return (
    <Header style={{ paddingInline: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flex: 1,
            minWidth: 0
          }}
        >
          <Link
            href="/vacantes"
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            aria-label="Selección IAD"
            title="Selección IAD"
          >
            <Image
              src={logo}
              alt="Selección IAD"
              priority
              style={{ height: 60, width: 'auto' }}
            />
          </Link>
          <Menu
            mode="horizontal"
            theme="dark"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={navigationItems}
            style={{ borderBottom: 'none', flex: 1, minWidth: 0 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Dropdown
            menu={dropdownMenu}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" style={{ color: '#fff' }}>
              <Space size="small">
                <UserOutlined />
                <span>{appUser?.name ? `Hola, ${appUser.name}` : 'Cuenta'}</span>
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>
    </Header>
  );
}
