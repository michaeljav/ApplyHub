'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spin } from 'antd';

interface RequireAuthProps {
  children: ReactNode;
  roles?: Array<'ADMIN' | 'RRHH'>;
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const { status, data } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasAllowedRole = useMemo(() => {
    if (!roles || roles.length === 0) return true;
    const rol = (data?.user as { rol?: string } | undefined)?.rol;
    return rol ? roles.includes(rol as 'ADMIN' | 'RRHH') : false;
  }, [data?.user, roles]);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      const query = searchParams?.toString();
      const callback = `${pathname}${query ? `?${query}` : ''}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callback || '/admin')}`);
      return;
    }

    if (status === 'authenticated' && !hasAllowedRole) {
      router.replace('/vacantes');
    }
  }, [status, hasAllowedRole, pathname, searchParams, router]);

  if (status === 'loading' || status === 'unauthenticated' || !hasAllowedRole) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Spin tip="Verificando acceso..." />
      </div>
    );
  }

  return <>{children}</>;
}
