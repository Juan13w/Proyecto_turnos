'use client';

import { useState } from 'react';
import { useIPValidation } from '@/hooks/use-ip-validation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, ShieldCheck, ShieldX, Eye } from 'lucide-react';

export function IPValidationDemo() {
  const { validateIP, getClientIP, isLoading, error } = useIPValidation();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [clientIP, setClientIP] = useState<string | null>(null);

  const handleValidateIP = async () => {
    const result = await validateIP();
    setValidationResult(result);
  };

  const handleGetIP = async () => {
    const ip = await getClientIP();
    setClientIP(ip);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Validación de IP de Sede
          </CardTitle>
          <CardDescription>
            Sistema de control de acceso basado en dirección IP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleGetIP} 
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Ver Mi IP
            </Button>
            
            <Button 
              onClick={handleValidateIP} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Validar Acceso
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {clientIP && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tu Dirección IP</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="font-mono">
                  {clientIP}
                </Badge>
              </CardContent>
            </Card>
          )}

          {validationResult && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {validationResult.success ? (
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <ShieldX className="h-4 w-4 text-red-600" />
                  )}
                  Resultado de Validación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={validationResult.success ? "default" : "destructive"}
                  >
                    {validationResult.success ? "ACCESO PERMITIDO" : "ACCESO DENEGADO"}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">IP Cliente:</span>{" "}
                    <span className="font-mono">{validationResult.clientIP}</span>
                  </div>
                  
                  {validationResult.allowedIPs && (
                    <div>
                      <span className="font-medium">IPs Permitidas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {validationResult.allowedIPs.map((ip: string, index: number) => (
                          <Badge key={index} variant="outline" className="font-mono text-xs">
                            {ip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">Mensaje:</span>{" "}
                    <span className={validationResult.success ? "text-green-700" : "text-red-700"}>
                      {validationResult.message}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Timestamp:</span>{" "}
                    <span className="text-gray-600">
                      {new Date(validationResult.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
