import React, { useEffect, useRef, useState } from 'react';
import { X, Loader } from 'lucide-react';
import Quagga from '@ericblade/quagga2';

const BarcodeScanner = ({ isOpen, onClose, onBarcodeDetected }) => {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const initScanner = async () => {
      try {
        setError('');
        setDetected('');
        setScanning(true);

        await Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: 'environment'
              },
              target: videoRef.current
            },
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'code_39_reader',
                'code_39_vin_reader',
                'codabar_reader',
                'upc_reader',
                'upc_e_reader',
                'i2of5_reader'
              ],
              debug: {
                showCanvas: false,
                showPatternLabels: false,
                showFrequency: false,
                showSkeleton: false
              }
            },
            locator: {
              halfSample: true
            },
            numOfWorkers: 4,
            frequency: 10
          },
          (err) => {
            if (err) {
              console.error('Error inicializando Quagga:', err);
              setError('No se pudo acceder a la cámara. Verifica los permisos.');
              setScanning(false);
              return;
            }

            Quagga.start();
            scannerRef.current = Quagga;

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
      } catch (err) {
        console.error('Error en scanner:', err);
        setError('Error al inicializar el escáner: ' + err.message);
        setScanning(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        try {
          Quagga.stop();
        } catch (err) {
          console.error('Error deteniendo Quagga:', err);
        }
      }
    };
  }, [isOpen, onBarcodeDetected]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        Quagga.stop();
      } catch (err) {
        console.error('Error deteniendo Quagga:', err);
      }
    }
    setScanning(false);
    setDetected('');
    setError('');
    onClose();
  };

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
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ display: scanning ? 'block' : 'none' }}
            />
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
