"use client"

import { LoginForm as LoginFormComponent } from './ui';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
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

  const handleLoginSuccess = (userData: any) => {
    onLogin(userData);
    onClose();
    
    // Redirigir según el tipo de usuario
    const isAdmin = userData.isAdmin;
    const targetPath = isAdmin ? '/admin' : '/empleado';
    
    try {
      router.replace(targetPath);
    } catch (_) {
      // Fallback duro si el enrutador falla
      window.location.href = targetPath;
    }
  };

  return (
    <LoginFormComponent 
      isOpen={isOpen} 
      onClose={onClose} 
      onLogin={handleLoginSuccess} 
    />
  );
};

export default LoginForm;
