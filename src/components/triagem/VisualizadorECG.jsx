import React, { useState } from "react";
import { FileText, ZoomIn, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function VisualizadorECG({ fileUrl, index, onRemover }) {
  const [modalAberto, setModalAberto] = useState(false);
  const isPDF = fileUrl.toLowerCase().endsWith('.pdf');

  return (
    <>
      <div className="border-2 border-yellow-200 rounded-lg overflow-hidden bg-white relative group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemover(index);
          }}
          className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5"
          title="Remover ECG"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="relative">
          {isPDF ? (
            <div className="h-32 flex flex-col items-center justify-center bg-gray-50 p-4">
              <FileText className="w-12 h-12 text-yellow-600 mb-2" />
              <p className="text-xs font-medium text-gray-700">ECG {index + 1} (PDF)</p>
            </div>
          ) : (
            <div className="h-32 overflow-hidden bg-gray-50">
              <img
                src={fileUrl}
                alt={`ECG ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPDF) {
                window.open(fileUrl, '_blank');
              } else {
                setModalAberto(true);
              }
            }}
            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all z-10"
            title="Ampliar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-6xl w-full p-2">
          <img
            src={fileUrl}
            alt={`ECG ${index + 1} ampliado`}
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}