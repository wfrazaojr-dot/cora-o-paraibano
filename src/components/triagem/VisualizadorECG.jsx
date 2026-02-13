import React from "react";
import { FileText, ExternalLink, X } from "lucide-react";

export default function VisualizadorECG({ fileUrl, index, onRemover }) {
  const handleVisualizarECG = () => {
    // Força abertura em nova aba
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="border-2 border-yellow-200 rounded-lg overflow-hidden bg-white relative group">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemover(index);
        }}
        className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
        title="Remover ECG"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div 
        className="relative cursor-pointer"
        onClick={handleVisualizarECG}
      >
        {fileUrl.toLowerCase().endsWith('.pdf') ? (
          <div className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">ECG {index + 1} - Clique para abrir</p>
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                Abrir em nova aba <ExternalLink className="w-3 h-3" />
              </p>
            </div>
          </div>
        ) : (
          <>
            <img
              src={fileUrl}
              alt={`ECG ${index + 1}`}
              className="w-full h-48 object-contain bg-gray-50"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}