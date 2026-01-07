const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Endpoint público - obtener todos los libros sin autenticación
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find().populate('categories').sort({ title: 1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
