const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nuestrabiblioteca');
    console.log('Conectado a MongoDB');

    const Book = require('../models/Book');
    const Category = require('../models/Category');

    const booksPath = path.join(__dirname, '../data/booksExample.json');
    
    if (!fs.existsSync(booksPath)) {
      console.log('⚠️  Archivo de libros no encontrado. Ejecuta primero: npm run export-books');
      process.exit(1);
    }

    const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    console.log(`Preparando para importar ${booksData.length} libros...`);

    // Obtener o crear categorías
    const categoryMap = {};
    for (const book of booksData) {
      for (const categoryName of book.categories) {
        if (!categoryMap[categoryName]) {
          let category = await Category.findOne({ name: categoryName });
          if (!category) {
            category = await Category.create({ name: categoryName });
            console.log(`✅ Categoría creada: ${categoryName}`);
          }
          categoryMap[categoryName] = category._id;
        }
      }
    }

    // Importar libros
    let imported = 0;
    let skipped = 0;

    for (const bookData of booksData) {
      try {
        // Verificar si el libro ya existe
        const existingBook = await Book.findOne({ isbn: bookData.isbn });
        if (existingBook) {
          skipped++;
          continue;
        }

        // Mapear categorías a IDs
        const categoryIds = bookData.categories.map(name => categoryMap[name]).filter(Boolean);

        const book = await Book.create({
          ...bookData,
          categories: categoryIds
        });

        imported++;
        if (imported % 5 === 0) {
          console.log(`Importados: ${imported}/${booksData.length}`);
        }
      } catch (error) {
        console.error(`Error importando libro "${bookData.title}":`, error.message);
      }
    }

    console.log(`\n✅ Importación completada:`);
    console.log(`   - Libros importados: ${imported}`);
    console.log(`   - Libros omitidos (ya existen): ${skipped}`);
    console.log(`   - Total: ${imported + skipped}/${booksData.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seedBooks();
