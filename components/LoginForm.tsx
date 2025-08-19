"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoginForm as LoginFormUI } from './ui/LoginForm';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
  isLoading?: boolean;
}

/**
 * Componente de formulario de inicio de sesión
 * 
 * Este componente maneja la autenticación de usuarios y redirección según el tipo de usuario.
 * Utiliza el componente de UI refactorizado y el hook personalizado useLoginForm.
 * 
 * @component
 * @param {Object} props - Las propiedades del componente
 * @param {boolean} props.isOpen - Indica si el formulario está abierto
 * @param {Function} props.onClose - Función para cerrar el formulario
 * @param {Function} props.onLogin - Callback que se ejecuta al iniciar sesión exitosamente
 */
const LoginForm = ({ isOpen, onClose, onLogin }: LoginFormProps) => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const handleLoginSuccess = async (userData: any) => {
    try {
      // Guardar el estado de autenticación
      if (userData.isAdmin) {
        localStorage.setItem('adminLogueado', 'true');
        localStorage.setItem('adminData', JSON.stringify(userData));
      } else {
        localStorage.setItem('empleadoLogueado', 'true');
        localStorage.setItem('empleadoData', JSON.stringify(userData));
      }
      
      // Notificar el inicio de sesión exitoso
      onLogin(userData);
      onClose();
      
      // Forzar recarga para asegurar que se aplique la autenticación
      window.location.href = userData.isAdmin ? '/admin' : '/';
      
    } catch (error) {
      console.error('Error during login redirection:', error);
      toast.error('Ocurrió un error al redirigir');
      setIsRedirecting(false);
    }
  };

  return (
    <LoginFormUI
      isOpen={isOpen} 
      onClose={onClose} 
      onLogin={handleLoginSuccess}
      isLoading={isRedirecting}
    />
  );
};

export default LoginForm;
