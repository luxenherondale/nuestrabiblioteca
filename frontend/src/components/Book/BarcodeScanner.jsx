import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader, Camera, AlertTriangle, Keyboard } from 'lucide-react';
import Quagga from '@ericblade/quagga2';

const BarcodeScanner = ({ isOpen, onClose, onBarcodeDetected }) => {
  const scannerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [detected, setDetected] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('pending');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualIsbn, setManualIsbn] = useState('');
  const isInitialized = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (isInitialized.current) {
      try {
        Quagga.offDetected();
        Quagga.stop();
        isInitialized.current = false;
      } catch (err) {
        console.error('Error deteniendo Quagga:', err);
      }
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setScanning(false);
    setDetected('');
    setError('');
    setPermissionStatus('pending');
    setShowManualInput(false);
    setManualIsbn('');
    onClose();
  }, [onClose, stopCamera]);

  const handleManualSubmit = () => {
    const cleanIsbn = manualIsbn.replace(/[-\s]/g, '').trim();
    if (cleanIsbn.length >= 10) {
      onBarcodeDetected(cleanIsbn);
      handleClose();
    } else {
      setError('El ISBN debe tener al menos 10 dígitos');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const initScanner = async () => {
      setError('');
      setDetected('');
      setPermissionStatus('requesting');

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      try {
        // PASO 1: Obtener permisos primero con cualquier cámara trasera
        // (Las etiquetas de dispositivos solo están disponibles DESPUÉS de obtener permisos)
        let initialStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        // PASO 2: Ahora que tenemos permisos, enumerar dispositivos con etiquetas
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        console.log('📷 Cámaras disponibles:', videoDevices.map(d => d.label));
        
        // Buscar la cámara principal (NO ultra wide, NO frontal)
        let selectedDeviceId = null;
        const backCameras = videoDevices.filter(d => {
          const label = d.label.toLowerCase();
          // Excluir cámaras frontales
          if (label.includes('front') || label.includes('selfie') || label.includes('user') || 
              label.includes('facing front') || label.includes('frontal')) return false;
          // Incluir solo cámaras traseras
          return label.includes('back') || label.includes('rear') || label.includes('trasera') || 
                 label.includes('facing back') || label.includes('environment');
        });
        
        // En Samsung S23: "camera 0, facing back" es la principal, "camera 2, facing back" es ultra wide
        // Preferir la cámara con número más BAJO entre las traseras (usualmente la principal)
        if (backCameras.length > 0) {
          // Ordenar por número de cámara (extraer el número del label)
          const sortedBackCameras = [...backCameras].sort((a, b) => {
            const numA = parseInt(a.label.match(/camera\s*(\d+)/i)?.[1] || '99');
            const numB = parseInt(b.label.match(/camera\s*(\d+)/i)?.[1] || '99');
            return numA - numB; // Menor número primero
          });
          
          // La primera cámara trasera ordenada por número es usualmente la principal
          const mainCamera = sortedBackCameras[0];
          
          if (mainCamera) {
            selectedDeviceId = mainCamera.deviceId;
            console.log('✅ Cámara principal seleccionada:', mainCamera.label);
          }
        }
        
        // PASO 3: Si encontramos una cámara mejor, reiniciar con ella
        if (selectedDeviceId) {
          // Detener el stream inicial
          initialStream.getTracks().forEach(track => track.stop());
          
          // Obtener stream con la cámara principal específica
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 }
            },
            audio: false
          });
          streamRef.current = stream;
        } else {
          // Usar el stream inicial si no encontramos una mejor opción
          streamRef.current = initialStream;
          console.log('⚠️ Usando cámara por defecto');
        }
        
        setPermissionStatus('granted');

        await new Promise(resolve => setTimeout(resolve, 300));

        if (!scannerContainerRef.current || isInitialized.current) {
          stopCamera();
          return;
        }

        const quaggaConfig = {
          inputStream: {
            type: 'LiveStream',
            target: scannerContainerRef.current,
            constraints: selectedDeviceId
              ? { 
                  deviceId: { exact: selectedDeviceId },
                  width: { ideal: 1920, min: 1280 },
                  height: { ideal: 1080, min: 720 }
                }
              : {
                  facingMode: 'environment',
                  width: { ideal: 1920, min: 1280 },
                  height: { ideal: 1080, min: 720 }
                },
            area: {
              top: '10%',
              right: '10%',
              left: '10%',
              bottom: '10%'
            }
          },
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'upc_reader',
              'upc_e_reader',
              'code_128_reader'
            ],
            multiple: false
          },
          locate: true,
          locator: {
            patchSize: isMobile ? 'medium' : 'large',
            halfSample: isMobile
          },
          numOfWorkers: isMobile ? 2 : Math.min(navigator.hardwareConcurrency || 4, 4),
          frequency: isMobile ? 5 : 10
        };

        Quagga.init(quaggaConfig, (err) => {
          if (err) {
            console.error('Error inicializando Quagga:', err);
            
            const simplifiedConfig = {
              ...quaggaConfig,
              inputStream: {
                ...quaggaConfig.inputStream,
                constraints: {
                  width: { ideal: 640 },
                  height: { ideal: 480 }
                }
              },
              locator: {
                patchSize: 'small',
                halfSample: true
              },
              numOfWorkers: 1
            };

            Quagga.init(simplifiedConfig, (fallbackErr) => {
              if (fallbackErr) {
                console.error('Error en fallback:', fallbackErr);
                setError('No se pudo iniciar el escáner. Usa la entrada manual.');
                setShowManualInput(true);
                stopCamera();
                return;
              }

              startQuagga();
            });
            return;
          }

          startQuagga();
        });

        function startQuagga() {
          Quagga.start();
          isInitialized.current = true;
          setScanning(true);

          const videoElement = scannerContainerRef.current?.querySelector('video');
          if (videoElement) {
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('muted', 'true');
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            videoElement.style.objectFit = 'cover';
            
            if (isIOS) {
              videoElement.play().catch(console.error);
            }
          }

          Quagga.onDetected((result) => {
            if (result.codeResult && result.codeResult.code) {
              const barcode = result.codeResult.code;
              const confidence = result.codeResult.decodedCodes?.reduce((acc, code) => {
                return code.error !== undefined ? acc + code.error : acc;
              }, 0) || 0;

              if (confidence < 0.5 || barcode.length >= 10) {
                setDetected(barcode);
                
                setTimeout(() => {
                  onBarcodeDetected(barcode);
                  handleClose();
                }, 600);
              }
            }
          });
        }

      } catch (err) {
        console.error('Error accediendo a cámara:', err);
        setPermissionStatus('denied');
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No se encontró ninguna cámara en este dispositivo.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('La cámara está en uso por otra aplicación.');
        } else if (err.name === 'OverconstrainedError') {
          setError('La cámara no soporta la configuración requerida.');
        } else {
          setError(`Error de cámara: ${err.message || 'Error desconocido'}`);
        }
        
        setShowManualInput(true);
      }
    };

    const timer = setTimeout(initScanner, 200);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, onBarcodeDetected, handleClose, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 'min(600px, calc(100% - 2rem))' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Escanear Código</h2>
          <button onClick={handleClose} className="btn btn-outline p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {detected && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <span className="font-medium">✓ ISBN detectado: {detected}</span>
          </div>
        )}

        <div className="space-y-4">
          {!showManualInput ? (
            <>
              <div 
                ref={scannerContainerRef}
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ 
                  width: '100%',
                  paddingBottom: '75%',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}>
                  {!scanning && permissionStatus !== 'denied' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                      <Loader className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                      <span className="text-gray-400 text-sm">
                        {permissionStatus === 'requesting' ? 'Solicitando cámara...' : 'Iniciando escáner...'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div 
                  className="absolute inset-0 pointer-events-none z-20"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{
                    width: '80%',
                    height: '30%',
                    border: '3px solid #a78bfa',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '60%',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)',
                      animation: 'scan 2s ease-in-out infinite'
                    }} />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="text-sm text-purple-600 hover:text-purple-800 underline flex items-center gap-1 mx-auto"
                >
                  <Keyboard className="w-4 h-4" />
                  ¿No funciona? Ingresa el ISBN manualmente
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">
                  Ingresa el ISBN manualmente
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN (10 o 13 dígitos)
                </label>
                <input
                  type="text"
                  value={manualIsbn}
                  onChange={(e) => setManualIsbn(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="978-3-16-148410-0"
                  className="input"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowManualInput(false);
                    setError('');
                  }}
                  className="btn btn-outline flex-1"
                >
                  Volver a cámara
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={manualIsbn.replace(/[-\s]/g, '').length < 10}
                  className="btn btn-primary flex-1"
                >
                  Usar ISBN
                </button>
              </div>
            </div>
          )}

          {!showManualInput && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Tips:</strong> Mantén distancia de 10-20cm • Buena iluminación • 
                Código centrado en el recuadro
              </p>
            </div>
          )}

          <div className="flex justify-end">
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
