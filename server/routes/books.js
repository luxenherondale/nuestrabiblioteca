const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const bookService = require('../services/bookService');

router.get('/', async (req, res) => {
  try {
    const { category, location, search } = req.query;
    let query = {};
    
    if (category) {
      query.categories = category;
    }
    
    if (location) {
      query.location = location;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    
    const books = await Book.find(query).populate('categories').sort({ title: 1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('categories');
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/search-by-isbn', async (req, res) => {
  try {
    const { isbn } = req.body;
    
    if (!isbn || !isbn.trim()) {
      return res.status(400).json({ message: 'Por favor ingresa un ISBN válido' });
    }
    
    const cleanISBN = isbn.replace(/[-\s]/g, '').trim();
    
    const existingBook = await Book.findOne({ isbn: cleanISBN });
    if (existingBook) {
      return res.status(400).json({ message: 'Este libro ya existe en tu biblioteca' });
    }
    
    const bookInfo = await bookService.getBookInfoByISBN(cleanISBN);
    res.json(bookInfo);
  } catch (error) {
    console.error('Error en search-by-isbn:', error);
    if (error.message === 'Libro no encontrado') {
      return res.status(404).json({ message: 'No se encontró ningún libro con ese ISBN. Verifica que sea correcto.' });
    }
    res.status(500).json({ message: error.message || 'Error al buscar el libro' });
  }
});

router.post('/add-by-isbn', async (req, res) => {
  try {
    const { isbn, coverImage } = req.body;
    
    if (!isbn || !isbn.trim()) {
      return res.status(400).json({ message: 'Por favor ingresa un ISBN válido' });
    }
    
    const cleanISBN = isbn.replace(/[-\s]/g, '').trim();
    
    if (!cleanISBN) {
      return res.status(400).json({ message: 'ISBN inválido después de limpiar' });
    }
    
    const existingBook = await Book.findOne({ isbn: cleanISBN });
    if (existingBook) {
      return res.status(400).json({ message: 'Este libro ya existe en tu biblioteca' });
    }
    
    const bookInfo = await bookService.getBookInfoByISBN(cleanISBN);
    
    // Si se proporciona una URL de portada personalizada, usarla
    if (coverImage) {
      bookInfo.coverImage = coverImage;
    }
    
    const book = new Book(bookInfo);
    await book.save();

    const savedBook = await Book.findById(book._id).populate('categories');
    res.status(201).json(savedBook || book);
  } catch (error) {
    console.error('Error en add-by-isbn:', error);
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Este libro ya existe en tu biblioteca' });
    }
    if (error.message === 'Libro no encontrado') {
      return res.status(404).json({ message: 'No se encontró ningún libro con ese ISBN. Verifica que sea correcto.' });
    }
    res.status(500).json({ message: error.message || 'Error al agregar el libro' });
  }
});

router.post('/add-manual', async (req, res) => {
  try {
    const { title, author, isbn, publisher, publishDate, description, pageCount, language, coverImage, categories, location, customLocation, genre } = req.body;
    
    if (!title || !title.trim() || !author || !author.trim()) {
      return res.status(400).json({ message: 'El título y autor son requeridos' });
    }
    
    const bookData = {
      isbn: isbn || `manual-${Date.now()}`,
      title: title.trim(),
      author: author.trim(),
      publisher: publisher || '',
      publishDate: publishDate || null,
      description: description || '',
      pageCount: pageCount || 0,
      language: language || 'es',
      coverImage: coverImage || '',
      categories: categories || [],
      location: location || 'Biblioteca Principal',
      customLocation: customLocation || '',
      genre: genre || ''
    };
    
    const book = new Book(bookData);
    await book.save();

    const savedBook = await Book.findById(book._id).populate('categories');
    res.status(201).json(savedBook || book);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe un libro con ese ISBN' });
    }
    res.status(500).json({ message: error.message });
  }
});

router.post('/search-external', async (req, res) => {
  try {
    const { query } = req.body;
    const books = await bookService.searchBooks(query);
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categories');
    
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/reading-status', async (req, res) => {
  try {
    const { person, read, rating, review, reviewDate, goodreadsUrl } = req.body;
    
    if (req.user.role !== 'admin' && req.user.reviewKey !== person) {
      return res.status(403).json({ message: 'No puedes modificar la reseña de otro usuario' });
    }
    
    const updateData = {};
    updateData[`readingStatus.${person}.read`] = read;
    
    if (rating !== undefined) {
      updateData[`readingStatus.${person}.rating`] = rating;
    }
    
    if (reviewDate) {
      updateData[`readingStatus.${person}.reviewDate`] = new Date(reviewDate);
    } else if (read) {
      updateData[`readingStatus.${person}.reviewDate`] = new Date();
    } else {
      updateData[`readingStatus.${person}.reviewDate`] = null;
    }
    
    if (review !== undefined) {
      updateData[`readingStatus.${person}.review`] = review;
    }
    
    if (goodreadsUrl !== undefined) {
      updateData[`readingStatus.${person}.goodreadsUrl`] = goodreadsUrl;
    }
    
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categories');
    
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    
    res.json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
