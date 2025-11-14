'use client';

import { Modal } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

interface ApplyWarningLinkProps {
  vacanteId: string | number;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function ApplyWarningLink({
  vacanteId,
  children,
  className,
  style
}: ApplyWarningLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const targetUrl = `/vacantes/${vacanteId}/aplicar`;
      Modal.confirm({
        title: 'Aviso importante',
        content: 'Solo puedes aplicar a una vacante.',
        okText: 'Continuar',
        cancelText: 'Cancelar',
        centered: true,
        onOk: () => router.push(targetUrl)
      });
    },
    [router, vacanteId]
  );

  return (
    <Link
      href={`/vacantes/${vacanteId}/aplicar`}
      onClick={handleClick}
      className={className}
      style={{
        display: 'inline-block',
        marginTop: 16,
        padding: '8px 16px',
        backgroundColor: '#fadb14',
        color: '#1f1f1f',
        borderRadius: 6,
        fontWeight: 600,
        textAlign: 'center',
        textDecoration: 'none',
        ...style
      }}
    >
      {children || 'Aplicar a esta vacante'}
    </Link>
  );
}
