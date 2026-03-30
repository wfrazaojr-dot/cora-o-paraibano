import { Button } from "@/components/ui/button";
import { FileUp, X } from "lucide-react";

export default function SecaoDocumentos({ formData, handleFileUpload, removerDocumento, uploadingFiles }) {
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
            const isImage = doc.file_url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(doc.file_url);
            return (
              <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-900 font-medium truncate flex-1">{doc.nome || `Documento ${idx + 1}`}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removerDocumento(idx)} className="text-red-600 hover:text-red-800 ml-2">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {isImage && (
                  <img src={doc.file_url} alt={doc.nome || `Documento ${idx + 1}`} className="max-h-48 max-w-full rounded border border-green-300 object-contain" />
                )}
                {!isImage && doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Visualizar arquivo</a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}