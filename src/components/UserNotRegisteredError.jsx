import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const UserNotRegisteredError = () => {
  // Redirecionar automaticamente para a página de solicitação de acesso
  useEffect(() => {
    window.location.href = '/SolicitarAcesso';
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Redirecionando para solicitação de acesso...</p>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;