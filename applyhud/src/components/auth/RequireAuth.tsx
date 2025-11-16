'use client';

import { ReactNode, Suspense, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Spin } from 'antd';

interface RequireAuthProps {
  children: ReactNode;
  roles?: Array<'ADMIN' | 'RRHH'>;
}

function LoadingView({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Spin tip={message} />
    </div>
  );
}

function RequireAuthInner({ children, roles }: RequireAuthProps) {
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
    return <LoadingView message="Verificando acceso..." />;
  }

  return <>{children}</>;
}

export default function RequireAuth(props: RequireAuthProps) {
  return (
    <Suspense fallback={<LoadingView message="Preparando sesión..." />}>
      <RequireAuthInner {...props} />
    </Suspense>
  );
}
