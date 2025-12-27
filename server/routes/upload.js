const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { authMiddleware } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
const coversDir = path.join(__dirname, '../uploads/covers');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const MAGIC_BYTES = {
  'ffd8ff': { ext: '.jpg', mime: 'image/jpeg' },
  '89504e47': { ext: '.png', mime: 'image/png' },
  '47494638': { ext: '.gif', mime: 'image/gif' },
  '52494646': { ext: '.webp', mime: 'image/webp' },
  '0000001c': { ext: '.avif', mime: 'image/avif' },
  '00000020': { ext: '.avif', mime: 'image/avif' }
};

const validateMagicBytes = (buffer) => {
  const hex = buffer.toString('hex', 0, 4).toLowerCase();
  
  for (const [magic, info] of Object.entries(MAGIC_BYTES)) {
    if (hex.startsWith(magic)) {
      return info;
    }
  }
  
  if (hex.startsWith('52494646')) {
    const webpCheck = buffer.toString('ascii', 8, 12);
    if (webpCheck === 'WEBP') {
      return MAGIC_BYTES['52494646'];
    }
  }
  
  return null;
};

const tempStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, AVIF)'), false);
  }
};

const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

const saveValidatedFile = (buffer, prefix, userId) => {
  const imageInfo = validateMagicBytes(buffer);
  if (!imageInfo) {
    throw new Error('Archivo inválido: los magic bytes no corresponden a una imagen válida');
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${prefix}-${userId}-${uniqueSuffix}${imageInfo.ext}`;
  const targetDir = prefix === 'cover' ? coversDir : uploadsDir;
  const filePath = path.join(targetDir, filename);
  
  fs.writeFileSync(filePath, buffer);
  
  return {
    filename,
    path: prefix === 'cover' ? `/uploads/covers/${filename}` : `/uploads/${filename}`,
    mime: imageInfo.mime
  };
};

const downloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Error descargando imagen: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout descargando imagen'));
    });
  });
};

router.post('/avatar', authMiddleware, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 5MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    try {
      const result = saveValidatedFile(req.file.buffer, 'avatar', req.user._id);
      res.json({
        message: 'Imagen subida correctamente',
        avatarUrl: result.path
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

router.post('/cover', authMiddleware, (req, res) => {
  upload.single('cover')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 5MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    try {
      const result = saveValidatedFile(req.file.buffer, 'cover', req.user._id);
      res.json({
        message: 'Portada subida correctamente',
        coverUrl: result.path
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

router.post('/cover-from-url', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL es requerida' });
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ message: 'URL inválida' });
    }
    
    const imageBuffer = await downloadImage(url);
    
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'La imagen es demasiado grande. Máximo 5MB' });
    }
    
    const result = saveValidatedFile(imageBuffer, 'cover', req.user._id);
    
    res.json({
      message: 'Portada descargada y guardada correctamente',
      coverUrl: result.path,
      originalUrl: url
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al descargar la imagen' });
  }
});

router.delete('/file/:type/:filename', authMiddleware, (req, res) => {
  const { type, filename } = req.params;
  
  if (type !== 'avatar' && type !== 'cover') {
    return res.status(400).json({ message: 'Tipo de archivo inválido' });
  }
  
  const isOwner = filename.includes(`-${req.user._id}-`);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No tienes permiso para eliminar esta imagen' });
  }
  
  const targetDir = type === 'cover' ? coversDir : uploadsDir;
  const filePath = path.join(targetDir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ message: 'Imagen eliminada correctamente' });
  } else {
    res.status(404).json({ message: 'Imagen no encontrada' });
  }
});

module.exports = router;
