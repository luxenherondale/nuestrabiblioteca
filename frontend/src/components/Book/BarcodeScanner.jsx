import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader } from 'lucide-react';
import Quagga from '@ericblade/quagga2';

const BarcodeScanner = ({ isOpen, onClose, onBarcodeDetected }) => {
  const scannerContainerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState('');
  const isInitialized = useRef(false);

  const handleClose = useCallback(() => {
    if (isInitialized.current) {
      try {
        Quagga.offDetected();
        Quagga.stop();
        isInitialized.current = false;
      } catch (err) {
        console.error('Error deteniendo Quagga:', err);
      }
    }
    setScanning(false);
    setDetected('');
    setError('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !scannerContainerRef.current || isInitialized.current) return;

    const initScanner = async () => {
      setError('');
      setDetected('');

      // Detect if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Mobile-friendly constraints with fallback
      const constraints = isMobile
        ? {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            facingMode: 'environment'
          }
        : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          };

      const initWithConstraints = (videoConstraints) => {
        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              constraints: videoConstraints,
              target: scannerContainerRef.current,
              area: {
                top: '0%',
                right: '0%',
                left: '0%',
                bottom: '0%'
              }
            },
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'upc_reader',
                'upc_e_reader',
                'code_128_reader'
              ]
            },
            locate: true,
            locator: {
              patchSize: isMobile ? 'small' : 'medium',
              halfSample: true
            },
            numOfWorkers: isMobile ? 2 : (navigator.hardwareConcurrency || 4),
            frequency: 10
          },
          (err) => {
            if (err) {
              console.error('Error inicializando Quagga:', err);
              // Try fallback without facingMode constraint
              if (videoConstraints.facingMode) {
                console.log('Intentando sin facingMode...');
                const fallbackConstraints = { ...videoConstraints };
                delete fallbackConstraints.facingMode;
                initWithConstraints(fallbackConstraints);
                return;
              }
              setError('No se pudo acceder a la cámara. Verifica los permisos.');
              setScanning(false);
              return;
            }

            Quagga.start();
            isInitialized.current = true;
            setScanning(true);

            Quagga.onDetected((result) => {
              if (result.codeResult && result.codeResult.code) {
                const barcode = result.codeResult.code;
                setDetected(barcode);
                
                setTimeout(() => {
                  onBarcodeDetected(barcode);
                  handleClose();
                }, 500);
              }
            });
          }
        );
      };

      initWithConstraints(constraints);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      if (isInitialized.current) {
        try {
          Quagga.offDetected();
          Quagga.stop();
          isInitialized.current = false;
        } catch (err) {
          console.error('Error deteniendo Quagga:', err);
        }
      }
    };
  }, [isOpen, onBarcodeDetected, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Escanear Código de Barras</h2>
          <button onClick={handleClose} className="btn btn-outline">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {detected && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <span>✓ ISBN detectado: {detected}</span>
          </div>
        )}

        <div className="space-y-4">
          <div 
            ref={scannerContainerRef}
            className="relative bg-black rounded-lg overflow-hidden"
            style={{ aspectRatio: '4/3', minHeight: '300px' }}
          >
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Loader className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Apunta la cámara al código de barras o ISBN del libro</li>
              <li>• Mantén una distancia de 10-20 cm</li>
              <li>• Asegúrate de que el código esté bien iluminado</li>
              <li>• El escaneo es automático cuando detecta el código</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={handleClose} className="btn btn-outline">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
