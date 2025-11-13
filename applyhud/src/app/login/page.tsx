'use client';

import { Button, Card, Form, Input, Typography, Alert, Spin } from 'antd';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/vacantes';
    const res = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
      callbackUrl
    });
    setLoading(false);
    if (res?.error) {
      setError('Credenciales inválidas');
    } else {
      router.push(callbackUrl);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/vacantes';
    router.replace(callbackUrl);
  }, [status, router, searchParams]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Spin tip="Redirigiendo..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="Acceso Recursos Humanos" style={{ width: 400 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Correo" name="email" rules={[{ required: true, message: 'Ingrese su correo' }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: 'Ingrese su contraseña' }]}>
            <Input.Password />
          </Form.Item>
          {error && (
            <Alert type="error" message={error} style={{ marginBottom: 16 }} />
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
          Solo usuarios autorizados del IAD.
        </Typography.Paragraph>
        <Button type="link" block>
          <Link href="/vacantes">← Volver a vacantes públicas</Link>
        </Button>
      </Card>
    </div>
  );
}
