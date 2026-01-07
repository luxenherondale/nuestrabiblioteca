const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const Book = require('../models/Book');
const bookService = require('../services/bookService');

// Configurar multer para archivos Excel
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

// Función para normalizar texto para comparación
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .trim();
}

// Función para calcular similitud entre dos strings
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  // Verificar si uno contiene al otro
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Verificar palabras en común
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word of words1) {
    if (word.length > 2 && words2.some(w => w.includes(word) || word.includes(w))) {
      matchCount++;
    }
  }
  
  const similarity = matchCount / Math.max(words1.length, words2.length);
  return similarity;
}

// Función para buscar libro por título y autor
async function searchBookByTitleAndAuthor(title, author) {
  try {
    // Buscar en Google Books por título y autor
    const query = `${title} ${author}`;
    const results = await bookService.searchBooks(query);
    
    if (!results || results.length === 0) {
      return { found: false, reason: 'No se encontraron resultados en la búsqueda' };
    }
    
    // Buscar la mejor coincidencia
    let bestMatch = null;
    let bestScore = 0;
    
    for (const book of results) {
      const titleSimilarity = calculateSimilarity(title, book.title);
      const authorSimilarity = calculateSimilarity(author, book.author);
      
      // El autor debe tener al menos 50% de similitud
      if (authorSimilarity < 0.5) continue;
      
      const score = (titleSimilarity * 0.6) + (authorSimilarity * 0.4);
      
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestMatch = book;
      }
    }
    
    if (bestMatch) {
      return { 
        found: true, 
        book: bestMatch,
        confidence: bestScore
      };
    }
    
    return { 
      found: false, 
      reason: `No se encontró coincidencia suficiente. Mejor resultado: "${results[0]?.title}" de "${results[0]?.author}"`
    };
  } catch (error) {
    console.error('Error buscando libro:', error);
    return { found: false, reason: 'Error en la búsqueda: ' + error.message };
  }
}

// Previsualizar importación (sin guardar)
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó archivo' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'El archivo Excel está vacío' });
    }

    const results = {
      toImport: [],      // Libros que se pueden importar
      notFound: [],      // Libros no encontrados
      alreadyExists: [], // Libros que ya existen
      pendingImage: [],  // Libros sin imagen (se agregarán pero necesitan foto)
      total: data.length
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Mapear columnas del Excel del usuario y convertir a strings
      const title = String(row['TITULO DEL LIBRO'] || row['TITULO'] || row['Titulo del libro'] || row['Titulo'] || '').trim();
      const author = String(row['AUTOR'] || row['Autor'] || '').trim();
      const leidoSebastian = row['LEIDO POR SEBASTIAN'] || row['Leido por Sebastian'] || '';
      const leidoAdaly = row['LEIDO POR ADALY'] || row['Leido por Adaly'] || '';
      const sinTerminarSebastian = row['SIN TERMINAR POR SEBASTIAN'] || row['Sin terminar por Sebastian'] || '';
      const sinTerminarAdaly = row['SIN TERMINAR POR ADALY'] || row['Sin terminar por Adaly'] || '';

      if (!title) {
        results.notFound.push({
          row: i + 2,
          title: '(vacío)',
          author: author,
          reason: 'Título vacío'
        });
        continue;
      }

      // Verificar si ya existe en la base de datos
      const existingBook = await Book.findOne({
        $or: [
          { title: { $regex: `^${title}$`, $options: 'i' } },
          { 
            title: { $regex: title.substring(0, 20), $options: 'i' },
            author: { $regex: author.split(' ')[0], $options: 'i' }
          }
        ]
      });

      if (existingBook) {
        results.alreadyExists.push({
          row: i + 2,
          title: title,
          author: author,
          existingTitle: existingBook.title,
          existingAuthor: existingBook.author
        });
        continue;
      }

      // Buscar en APIs externas
      const searchResult = await searchBookByTitleAndAuthor(title, author);

      if (!searchResult.found) {
        results.notFound.push({
          row: i + 2,
          title: title,
          author: author,
          reason: searchResult.reason
        });
        continue;
      }

      // Determinar estado de lectura
      const readingStatus = {
        sebastian: {
          read: !!(leidoSebastian && leidoSebastian.toString().trim().toLowerCase() !== 'no' && leidoSebastian.toString().trim() !== ''),
          rating: 0,
          review: sinTerminarSebastian && sinTerminarSebastian.toString().trim() ? 'Sin terminar' : ''
        },
        adaly: {
          read: !!(leidoAdaly && leidoAdaly.toString().trim().toLowerCase() !== 'no' && leidoAdaly.toString().trim() !== ''),
          rating: 0,
          review: sinTerminarAdaly && sinTerminarAdaly.toString().trim() ? 'Sin terminar' : ''
        }
      };

      const bookData = {
        ...searchResult.book,
        isbn: searchResult.book.isbn || `import-${Date.now()}-${i}`,
        readingStatus,
        confidence: searchResult.confidence
      };

      // Verificar si tiene imagen
      if (!bookData.coverImage) {
        results.pendingImage.push({
          row: i + 2,
          title: bookData.title,
          author: bookData.author,
          originalTitle: title,
          originalAuthor: author
        });
      }

      results.toImport.push({
        row: i + 2,
        originalTitle: title,
        originalAuthor: author,
        bookData,
        hasImage: !!bookData.coverImage
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error en preview:', error);
    res.status(500).json({ message: 'Error procesando archivo: ' + error.message });
  }
});

// Confirmar importación
router.post('/confirm', async (req, res) => {
  try {
    const { books, location = 'Biblioteca Principal' } = req.body;

    if (!books || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: 'No hay libros para importar' });
    }

    const results = {
      imported: [],
      failed: []
    };

    for (const item of books) {
      try {
        const bookData = item.bookData;
        
        // Verificar duplicado por ISBN
        if (bookData.isbn && !bookData.isbn.startsWith('import-')) {
          const existing = await Book.findOne({ isbn: bookData.isbn });
          if (existing) {
            results.failed.push({
              title: bookData.title,
              reason: 'ISBN duplicado'
            });
            continue;
          }
        }

        const newBook = new Book({
          isbn: bookData.isbn || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: bookData.title,
          author: bookData.author,
          publisher: bookData.publisher || '',
          publishDate: bookData.publishDate || null,
          description: bookData.description || '',
          pageCount: bookData.pageCount || 0,
          language: bookData.language || '',
          coverImage: bookData.coverImage || '',
          categories: [],
          location: location,
          readingStatus: bookData.readingStatus || {
            sebastian: { read: false, rating: 0 },
            adaly: { read: false, rating: 0 }
          }
        });

        await newBook.save();
        results.imported.push({
          id: newBook._id,
          title: newBook.title,
          author: newBook.author,
          hasImage: !!newBook.coverImage
        });
      } catch (error) {
        results.failed.push({
          title: item.bookData?.title || 'Desconocido',
          reason: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error en confirm:', error);
    res.status(500).json({ message: 'Error importando libros: ' + error.message });
  }
});

// Exportar libros a Excel
router.get('/export', async (req, res) => {
  try {
    const books = await Book.find().sort({ title: 1 });

    const exportData = books.map(book => ({
      'TITULO DEL LIBRO': book.title,
      'AUTOR': book.author,
      'ISBN': book.isbn,
      'EDITORIAL': book.publisher || '',
      'PAGINAS': book.pageCount || '',
      'UBICACION': book.location || '',
      'LEIDO POR SEBASTIAN': book.readingStatus?.sebastian?.read ? 'Sí' : 'No',
      'LEIDO POR ADALY': book.readingStatus?.adaly?.read ? 'Sí' : 'No',
      'RATING SEBASTIAN': book.readingStatus?.sebastian?.rating || '',
      'RATING ADALY': book.readingStatus?.adaly?.rating || '',
      'TIENE PORTADA': book.coverImage ? 'Sí' : 'No'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Libros');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=biblioteca_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error en export:', error);
    res.status(500).json({ message: 'Error exportando libros: ' + error.message });
  }
});

// Obtener libros sin imagen (pendientes)
router.get('/pending-images', async (req, res) => {
  try {
    const books = await Book.find({
      $or: [
        { coverImage: '' },
        { coverImage: null },
        { coverImage: { $exists: false } }
      ]
    }).sort({ title: 1 });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
