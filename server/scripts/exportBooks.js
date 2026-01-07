const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function exportBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nuestrabiblioteca');
    console.log('Conectado a MongoDB');

    const Book = require('../models/Book');
    const books = await Book.find().populate('categories');
    console.log(`Encontrados ${books.length} libros`);

    const booksData = books.map(book => ({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      publishDate: book.publishDate,
      description: book.description,
      pageCount: book.pageCount,
      language: book.language,
      coverImage: book.coverImage,
      categories: book.categories.map(cat => cat.name),
      location: book.location,
      customLocation: book.customLocation,
      genre: book.genre,
      readingStatus: book.readingStatus
    }));

    const outputPath = path.join(__dirname, '../data/booksExample.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(booksData, null, 2));
    console.log(`✅ Libros exportados a: ${outputPath}`);
    console.log(`Total de libros: ${booksData.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error exportando libros:', error);
    process.exit(1);
  }
}

exportBooks();
