'use client';

import { Button, Tooltip } from 'antd';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoginOutlined, DashboardOutlined } from '@ant-design/icons';

export default function AdminAccessIcon() {
  const { data: session } = useSession();
  const router = useRouter();
  const isLogged = Boolean(session?.user);

  const handleClick = () => {
    router.push(isLogged ? '/admin/vacantes' : '/login');
  };

  return (
    <Tooltip
      title={isLogged ? 'Ir al panel de Recursos Humanos' : 'Acceder a administración'}
    >
      <Button
        type="text"
        shape="circle"
        icon={isLogged ? <DashboardOutlined /> : <LoginOutlined />}
        onClick={handleClick}
      />
    </Tooltip>
  );
}
