const axios = require('axios');
const { chromium } = require('playwright');

class BookService {
  // Intenta Google Books primero, luego Open Library, luego ISBN Chile como respaldo
  async getBookInfoByISBN(isbn) {
    const errors = [];
    
    // Primero intentar con Google Books
    try {
      const googleResult = await this.getFromGoogleBooks(isbn);
      if (googleResult) return googleResult;
    } catch (error) {
      console.log('Google Books error:', error.message);
      errors.push(`Google Books: ${error.message}`);
    }
    
    // Si no encuentra, intentar con Open Library
    try {
      const openLibraryResult = await this.getFromOpenLibrary(isbn);
      if (openLibraryResult) return openLibraryResult;
    } catch (error) {
      console.log('Open Library error:', error.message);
      errors.push(`Open Library: ${error.message}`);
    }
    
    // Último recurso: ISBN Chile (scraping)
    try {
      console.log('Intentando con ISBN Chile...');
      const isbnChileResult = await this.getFromISBNChile(isbn);
      if (isbnChileResult) return isbnChileResult;
    } catch (error) {
      console.log('ISBN Chile error:', error.message);
      errors.push(`ISBN Chile: ${error.message}`);
    }
    
    // Si ninguna fuente encontró el libro
    console.log('Libro no encontrado en ninguna fuente. Errores:', errors);
    throw new Error('Libro no encontrado');
  }

  async getFromGoogleBooks(isbn) {
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      
      if (!response.data.totalItems || response.data.totalItems === 0) {
        return null;
      }

      const bookData = response.data.items[0].volumeInfo;

      const imageLinks = bookData.imageLinks || {};
      let coverImage =
        imageLinks.extraLarge ||
        imageLinks.large ||
        imageLinks.medium ||
        imageLinks.thumbnail ||
        imageLinks.smallThumbnail ||
        '';

      if (coverImage) {
        coverImage = coverImage.replace('http://', 'https://');
        coverImage = coverImage.replace('zoom=1', 'zoom=2');
      }
      
      return {
        isbn: isbn,
        title: bookData.title || 'Sin título',
        author: bookData.authors ? bookData.authors.join(', ') : 'Autor desconocido',
        publisher: bookData.publisher || '',
        publishDate: bookData.publishedDate || null,
        description: bookData.description || '',
        pageCount: bookData.pageCount || 0,
        language: bookData.language || '',
        coverImage,
        categories: []
      };
    } catch (error) {
      console.log('Google Books no encontró el libro, intentando Open Library...');
      return null;
    }
  }

  async getFromOpenLibrary(isbn) {
    try {
      // Open Library API
      const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      
      const bookKey = `ISBN:${isbn}`;
      if (!response.data[bookKey]) {
        return null;
      }

      const bookData = response.data[bookKey];
      
      // Obtener la portada de Open Library
      let coverImage = '';
      if (bookData.cover) {
        coverImage = bookData.cover.large || bookData.cover.medium || bookData.cover.small || '';
      }

      if (coverImage) {
        coverImage = coverImage.replace('http://', 'https://');
      }

      return {
        isbn: isbn,
        title: bookData.title || 'Sin título',
        author: bookData.authors ? bookData.authors.map(a => a.name).join(', ') : 'Autor desconocido',
        publisher: bookData.publishers ? bookData.publishers[0].name : '',
        publishDate: bookData.publish_date || null,
        description: bookData.notes || bookData.excerpts?.[0]?.text || '',
        pageCount: bookData.number_of_pages || 0,
        language: '',
        coverImage: coverImage,
        categories: []
      };
    } catch (error) {
      console.log('Open Library tampoco encontró el libro');
      return null;
    }
  }

  async getFromISBNChile(isbn) {
    let browser = null;
    try {
      // Formatear ISBN con guiones para mejor búsqueda en ISBN Chile
      const formattedIsbn = this.formatISBNWithDashes(isbn);
      
      try {
        // Use system Chromium if available (set via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)
        const launchOptions = { headless: true };
        if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
          launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
        }
        browser = await chromium.launch(launchOptions);
      } catch (launchError) {
        console.log('Playwright no disponible en este entorno (faltan binarios del navegador), omitiendo ISBN Chile:', launchError.message);
        return null;
      }
      
      const page = await browser.newPage();
      
      // Ir a la página de búsqueda
      const searchUrl = `https://isbnchile.cl/catalogo.php?mode=resultados_rapidos&palabra=${formattedIsbn}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Esperar contenido
      await page.waitForTimeout(2000);
      
      // Cerrar modal si existe
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Buscar link del título
      const titleLink = await page.$('a.titulo');
      if (!titleLink) {
        await browser.close();
        return null;
      }
      
      // Click en el resultado
      await titleLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      // Extraer información
      const bookInfo = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        // Título
        const isbnLine = bodyText.match(/ISBN\s+[\d-]+\s*\n([^\n]+)/);
        const title = isbnLine ? isbnLine[1].trim() : '';
        
        // Autor
        const authorMatch = bodyText.match(/Autor[:\s]+([^\n]+)/i);
        const author = authorMatch ? authorMatch[1].trim() : '';
        
        // Editorial
        const editorialMatch = bodyText.match(/Editorial[:\s]+([^\n]+)/i);
        const publisher = editorialMatch ? editorialMatch[1].trim() : '';
        
        // Descripción
        const reseñaSection = bodyText.match(/Reseña\s*\n([\s\S]*?)(?=Contáctenos|$)/i);
        const description = reseñaSection ? reseñaSection[1].trim().substring(0, 1000) : '';
        
        // Páginas
        const pagesMatch = bodyText.match(/Número de páginas[:\s]+(\d+)/i);
        const pageCount = pagesMatch ? parseInt(pagesMatch[1]) : 0;
        
        // ISBN
        const isbnMatch = bodyText.match(/ISBN\s+([\d-]+)/);
        const foundIsbn = isbnMatch ? isbnMatch[1].replace(/-/g, '') : '';
        
        // Fecha publicación
        const publishedMatch = bodyText.match(/Publicado[:\s]+([\d-]+)/i);
        const publishDate = publishedMatch ? publishedMatch[1].trim() : null;
        
        // Género
        const materiaMatch = bodyText.match(/Materia[:\s]+([^\n]+)/i);
        const genre = materiaMatch ? materiaMatch[1].trim() : '';
        
        // Imagen de portada - buscar en div.col-md-5
        let coverImage = '';
        const imageContainer = document.querySelector('div.col-md-5');
        if (imageContainer) {
          const img = imageContainer.querySelector('img');
          if (img && img.src) {
            coverImage = img.src;
          }
        }
        
        return { title, author, publisher, description, pageCount, isbn: foundIsbn, publishDate, genre, coverImage };
      });
      
      await browser.close();
      
      if (!bookInfo.title) {
        return null;
      }
      
      return {
        isbn: bookInfo.isbn || isbn,
        title: bookInfo.title || 'Sin título',
        author: bookInfo.author || 'Autor desconocido',
        publisher: bookInfo.publisher || '',
        publishDate: bookInfo.publishDate,
        description: bookInfo.description || '',
        pageCount: bookInfo.pageCount || 0,
        language: 'es',
        coverImage: bookInfo.coverImage || '',
        categories: [],
        source: 'isbnchile'
      };
    } catch (error) {
      console.log('ISBN Chile error:', error.message);
      if (browser) await browser.close();
      return null;
    }
  }

  formatISBNWithDashes(isbn) {
    // Remover guiones existentes
    const clean = isbn.replace(/-/g, '');
    // Si es ISBN-13 chileno (978-956-...), formatear con guiones
    if (clean.length === 13 && clean.startsWith('978956')) {
      return `978-956-${clean.substring(6, 11)}-${clean.substring(11, 12)}-${clean.substring(12)}`;
    }
    return isbn;
  }

  async searchBooks(query) {
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`);
      
      return response.data.items.map(item => {
        const bookData = item.volumeInfo;
        return {
          id: item.id,
          isbn: bookData.industryIdentifiers?.[0]?.identifier || '',
          title: bookData.title || 'Sin título',
          author: bookData.authors ? bookData.authors.join(', ') : 'Autor desconocido',
          publisher: bookData.publisher || '',
          publishDate: bookData.publishedDate || '',
          description: bookData.description || '',
          pageCount: bookData.pageCount || 0,
          language: bookData.language || '',
          coverImage: bookData.imageLinks?.thumbnail || '',
          categories: bookData.categories || []
        };
      });
    } catch (error) {
      console.error('Error buscando libros:', error);
      throw error;
    }
  }
}

module.exports = new BookService();
