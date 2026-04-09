import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, X, Eye, Loader2 } from "lucide-react";

export default function SecaoDocumentos({ formData, handleFileUpload, removerDocumento, uploadingFiles, visualizarDocumento }) {
  const [loadingIdx, setLoadingIdx] = useState(null);

  const handleVisualizar = async (doc, idx) => {
    if (!doc.file_uri) return;
    setLoadingIdx(idx);
    await visualizarDocumento(doc.file_uri);
    setLoadingIdx(null);
  };
  return (
    <div>
      <h3 className="text-base font-bold mb-3 border-b pb-2 text-blue-900">DOCUMENTOS DO PACIENTE (máx. 4 arquivos)</h3>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors mb-4">
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.gif,.png"
          disabled={formData.documentos.length >= 4}
        />
        <label htmlFor="file-upload" className={`cursor-pointer ${formData.documentos.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <FileUp className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">{formData.documentos.length >= 4 ? 'Limite de 4 arquivos atingido' : 'Clique para adicionar documentos'}</p>
          <p className="text-xs text-gray-500">PDF, JPG, PNG</p>
        </label>
      </div>
      {uploadingFiles && <p className="text-blue-600 text-sm text-center mb-2">Enviando arquivos...</p>}
      {formData.documentos.length > 0 && (
        <div className="space-y-2">
          {formData.documentos.map((doc, idx) => {
            return (
              <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-900 font-medium truncate flex-1">{doc.nome || `Documento ${idx + 1}`}</span>
                  <div className="flex items-center gap-1 ml-2">
                    {doc.file_uri && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleVisualizar(doc, idx)} disabled={loadingIdx === idx} className="text-blue-600 hover:text-blue-800">
                        {loadingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => removerDocumento(idx)} className="text-red-600 hover:text-red-800">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}