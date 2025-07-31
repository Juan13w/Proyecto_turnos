import { useState, useCallback } from 'react';

interface IPValidationResponse {
  success: boolean;
  message: string;
  clientIP: string;
  allowedIPs?: string[];
  timestamp: string;
}

interface IPResponse {
  clientIP: string;
  timestamp: string;
}

export function useIPValidation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateIP = useCallback(async (): Promise<IPValidationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ip-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: IPValidationResponse = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Error en la validación de IP');
        return data;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getClientIP = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ip-validation', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error obteniendo IP del cliente');
      }

      const data: IPResponse = await response.json();
      return data.clientIP;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    validateIP,
    getClientIP,
    isLoading,
    error,
  };
}
