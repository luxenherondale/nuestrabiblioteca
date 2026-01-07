# Ejemplos de Componentes Mobile-First Correctos

## 1. Modal Responsive con Video/Cámara

### ✅ COMPONENTE CORRECTO

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setStreaming(true);
          };
        }
      } catch (err) {
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        console.error('Camera error:', err);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && streaming) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob(blob => {
        onCapture(blob);
        onClose();
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Capturar Foto</h2>
          <button 
            onClick={onClose} 
            className="btn btn-outline"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Contenedor de video responsive */}
        <div 
          className="video-container video-container--4-3"
          style={{
            width: '100%',
            maxWidth: '100%',
            backgroundColor: '#000',
            borderRadius: '0.5rem',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-outline">
            Cancelar
          </button>
          <button 
            onClick={handleCapture} 
            disabled={!streaming}
            className="btn btn-primary"
          >
            Capturar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
```

### CSS Correspondiente

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal {
  width: 100%;
  max-width: min(600px, calc(100% - 2rem));
  max-height: min(90dvh, calc(100dvh - 2rem));
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  margin: auto;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-container--4-3 {
  aspect-ratio: 4/3;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (max-width: 480px) {
  .modal {
    padding: 1rem;
    border-radius: 0.75rem;
  }
}
```

---

## 2. Grid Responsive (Mobile-First)

### ❌ INCORRECTO

```jsx
// MAL: Comienza con 5 columnas
const BookGrid = ({ books }) => (
  <div style={{ 
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '1rem'
  }}>
    {books.map(book => <BookCard key={book.id} book={book} />)}
  </div>
);
```

### ✅ CORRECTO

```jsx
// BIEN: Comienza con 2 columnas en móviles
const BookGrid = ({ books }) => (
  <div className="library-books-grid">
    {books.map(book => <BookCard key={book.id} book={book} />)}
  </div>
);
```

```css
/* Mobile-first approach */
.library-books-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .library-books-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .library-books-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .library-books-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

---

## 3. Chips/Badges Responsive

### ❌ INCORRECTO

```jsx
// MAL: Sin flex-wrap, se desborda
const FilterChips = ({ filters }) => (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {filters.map(filter => (
      <button key={filter.id} style={{ whiteSpace: 'nowrap' }}>
        {filter.label}
      </button>
    ))}
  </div>
);
```

### ✅ CORRECTO

```jsx
// BIEN: Con flex-wrap y responsive
const FilterChips = ({ filters }) => (
  <div className="chip-container">
    {filters.map(filter => (
      <button key={filter.id} className="chip">
        {filter.label}
      </button>
    ))}
  </div>
);
```

```css
.chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
}
```

---

## 4. Input Responsive (Prevenir Zoom en iOS)

### ❌ INCORRECTO

```jsx
// MAL: Font-size < 16px causa zoom en iOS
<input 
  type="text" 
  style={{ fontSize: '14px' }}
  placeholder="Buscar..."
/>
```

### ✅ CORRECTO

```jsx
// BIEN: Font-size >= 16px previene zoom
<input 
  type="text" 
  className="input"
  placeholder="Buscar..."
/>
```

```css
input,
select,
textarea,
button {
  font-size: 16px;  /* Previene zoom en iOS */
  width: 100%;
  max-width: 100%;
}

@media (min-width: 768px) {
  input,
  select,
  textarea {
    font-size: 1rem;  /* 16px */
  }
}
```

---

## 5. Contenedor Flexible (Evitar Overflow)

### ❌ INCORRECTO

```jsx
// MAL: width: 100vw incluye scrollbar
<div style={{ width: '100vw', padding: '2rem' }}>
  {/* Total = 100vw + 4rem = overflow */}
</div>
```

### ✅ CORRECTO

```jsx
// BIEN: width: 100% con box-sizing: border-box
<div style={{ 
  width: '100%',
  maxWidth: '100%',
  padding: '2rem',
  boxSizing: 'border-box'
}}>
  {/* Total = 100% */}
</div>
```

---

## 6. Sidebar Responsive

### ✅ COMPONENTE CORRECTO

```jsx
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => 
    window.innerWidth >= 768
  );

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Contenido del sidebar */}
      </aside>

      <main className="main-content">
        {children}
      </main>

      {/* Overlay para cerrar sidebar en móviles */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
```

```css
.layout-container {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  z-index: 40;
  background: white;
  transition: transform 0.3s ease;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sidebar.closed {
  transform: translateX(-100%);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 30;
}

@media (min-width: 768px) {
  .sidebar {
    position: relative;
    transform: translateX(0);
    width: 16rem;
  }

  .sidebar-overlay {
    display: none;
  }
}
```

---

## 7. Modal con Teclado Virtual (iOS)

### ✅ COMPONENTE CORRECTO

```jsx
const FormModal = ({ isOpen, onClose }) => {
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevenir scroll del body cuando modal está abierto
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Formulario</h2>

        <input
          type="text"
          placeholder="Nombre"
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput(null)}
          className="input"
        />

        <input
          type="email"
          placeholder="Email"
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
          className="input"
        />

        <button onClick={onClose} className="btn btn-primary">
          Enviar
        </button>
      </div>
    </div>
  );
};
```

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal {
  width: 100%;
  max-width: min(600px, calc(100% - 2rem));
  max-height: min(90dvh, calc(100dvh - 2rem));
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  margin: auto;
}

/* Prevenir que el teclado virtual corte el contenido */
@media (max-height: 600px) {
  .modal {
    max-height: 100dvh;
    padding: 1rem;
  }
}
```

---

## 8. Detección de Dispositivo (Opcional)

```jsx
// Hook para detectar si es móvil
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Uso
const MyComponent = () => {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
};
```

---

## 9. Testing en DevTools

### Chrome DevTools - Device Toolbar

1. Abre DevTools (F12)
2. Click en icono "Toggle device toolbar" (Ctrl+Shift+M)
3. Selecciona dispositivos:
   - iPhone 12 (390x844)
   - Pixel 5 (393x851)
   - iPad (768x1024)
   - Galaxy Tab (800x1280)

### Verificar:

- [ ] Sin scroll horizontal
- [ ] Modales centrados y responsive
- [ ] Video visible en cámara
- [ ] Inputs no hacen zoom
- [ ] Con teclado virtual (F12 > ... > Show console drawer)
- [ ] Landscape mode funciona

---

## 10. Checklist Final

### CSS Global
- [ ] `overflow-x: hidden` en html/body
- [ ] `box-sizing: border-box` en *
- [ ] `height: 100dvh` en lugar de `100vh`
- [ ] Viewport meta tag correcto

### Modales
- [ ] `max-width: min(600px, calc(100% - 2rem))`
- [ ] `max-height: min(90dvh, calc(100dvh - 2rem))`
- [ ] Padding en overlay
- [ ] `-webkit-overflow-scrolling: touch`

### Grids
- [ ] Mobile-first (2 columnas por defecto)
- [ ] Media queries para escalado
- [ ] Gap proporcional

### Video/Cámara
- [ ] `aspect-ratio` con fallback
- [ ] `width: 100%` y `height: 100%`
- [ ] `object-fit: cover`
- [ ] Manejo de permisos

### Inputs
- [ ] `font-size: 16px` (previene zoom iOS)
- [ ] `width: 100%` con `box-sizing: border-box`
- [ ] Placeholder visible

### Testing
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Landscape mode
- [ ] Con teclado virtual
- [ ] Sin scroll horizontal
