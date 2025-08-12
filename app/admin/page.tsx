'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PanelAdmin from '@/components/PanelAdmin';

export default function AdminPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminLogueado = localStorage.getItem('adminLogueado');
    const adminDataStr = localStorage.getItem('adminData');

    if (!adminLogueado || !adminDataStr) {
      router.push('/');
      return;
    }

    try {
      const data = JSON.parse(adminDataStr);
      setUserData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar datos del administrador:', err);
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminLogueado');
    localStorage.removeItem('adminData');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando datos del administrador...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No se encontraron datos del administrador. Redirigiendo...</p>
      </div>
    );
  }

  return <PanelAdmin user={userData} onLogout={handleLogout} />;
}
