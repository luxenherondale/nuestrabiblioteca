const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  publisher: String,
  publishDate: Date,
  description: String,
  pageCount: Number,
  language: String,
  coverImage: String,
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  location: {
    type: String,
    enum: ['Biblioteca Principal', 'Biblioteca Blanca', 'Otro'],
    default: 'Biblioteca Principal'
  },
  customLocation: String,
  genre: String,
  readingStatus: {
    adaly: {
      read: { type: Boolean, default: false },
      rating: { type: Number, min: 0, max: 10, default: 0 },
      review: String,
      reviewDate: Date,
      goodreadsUrl: String
    },
    sebastian: {
      read: { type: Boolean, default: false },
      rating: { type: Number, min: 0, max: 10, default: 0 },
      review: String,
      reviewDate: Date,
      goodreadsUrl: String
    }
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Book', bookSchema);
