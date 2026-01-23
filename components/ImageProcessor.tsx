'use client';

import { useState } from 'react';

interface ImageProcessorProps {
  onTextExtracted: (text: string) => void;
  onDescriptionRequest: () => void;
}

export default function ImageProcessor({ 
  onTextExtracted, 
  onDescriptionRequest 
}: ImageProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractText = async (imageUrl: string) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Tesseract import dinamico per evitare SSR issues
      const { recognize } = await import('tesseract.js');
      const { data: { text } } = await recognize(
        imageUrl,
        'eng+ita',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
        }
      );
      
      onTextExtracted(text.trim());
    } catch (error) {
      console.error('OCR fallito:', error);
      onTextExtracted('[Estrazione testo fallita. Descrivi manualmente.]');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="mt-4 p-5 border border-red-900/40 rounded-lg bg-black/70 backdrop-blur-sm">
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => {
            const imageUrl = localStorage.getItem('lastSelectedImage');
            if (imageUrl) extractText(imageUrl);
          }}
          disabled={isProcessing}
          className="flex-1 bg-red-900/40 text-red-400 py-3 rounded font-mono text-sm hover:bg-red-900/60 disabled:opacity-50 transition"
        >
          {isProcessing ? `Estraendo... ${progress}%` : '📜 Estrai testo (OCR)'}
        </button>
        
        <button
          onClick={onDescriptionRequest}
          className="flex-1 bg-red-950/50 text-red-300 py-3 rounded font-mono text-sm hover:bg-red-900/50 transition border border-red-900/30"
        >
          🔥 Descrivi l'immagine
        </button>
      </div>
      <p className="text-xs text-red-600/60 italic">
        L'OCR funziona meglio con testo chiaro. Altrimenti, lascia che il fuoco parli.
      </p>
    </div>
  );
}