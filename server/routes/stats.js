const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

router.get('/overview', async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const adalyRead = await Book.countDocuments({ 'readingStatus.adaly.read': true });
    const sebastianRead = await Book.countDocuments({ 'readingStatus.sebastian.read': true });
    const bothRead = await Book.countDocuments({ 
      'readingStatus.adaly.read': true, 
      'readingStatus.sebastian.read': true 
    });
    
    res.json({
      totalBooks,
      adalyRead,
      sebastianRead,
      bothRead,
      unreadByAdaly: totalBooks - adalyRead,
      unreadBySebastian: totalBooks - sebastianRead
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/reading-by-month', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const adalyMonthly = await Book.aggregate([
      { $match: { 'readingStatus.adaly.read': true } },
      { $project: {
        month: { $month: '$readingStatus.adaly.reviewDate' },
        year: { $year: '$readingStatus.adaly.reviewDate' }
      }},
      { $match: { year: parseInt(year) } },
      { $group: { _id: '$month', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const sebastianMonthly = await Book.aggregate([
      { $match: { 'readingStatus.sebastian.read': true } },
      { $project: {
        month: { $month: '$readingStatus.sebastian.reviewDate' },
        year: { $year: '$readingStatus.sebastian.reviewDate' }
      }},
      { $match: { year: parseInt(year) } },
      { $group: { _id: '$month', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    const adalyData = months.map(month => {
      const found = adalyMonthly.find(item => item._id === month);
      return found ? found.count : 0;
    });
    
    const sebastianData = months.map(month => {
      const found = sebastianMonthly.find(item => item._id === month);
      return found ? found.count : 0;
    });
    
    res.json({
      months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      adalyData,
      sebastianData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/by-category', async (req, res) => {
  try {
    const books = await Book.find().populate('categories');
    
    const categoryStats = {};
    
    books.forEach(book => {
      book.categories.forEach(category => {
        if (!categoryStats[category.name]) {
          categoryStats[category.name] = {
            total: 0,
            adalyRead: 0,
            sebastianRead: 0,
            bothRead: 0
          };
        }
        
        categoryStats[category.name].total++;
        
        if (book.readingStatus.adaly.read) {
          categoryStats[category.name].adalyRead++;
        }
        
        if (book.readingStatus.sebastian.read) {
          categoryStats[category.name].sebastianRead++;
        }
        
        if (book.readingStatus.adaly.read && book.readingStatus.sebastian.read) {
          categoryStats[category.name].bothRead++;
        }
      });
    });
    
    res.json(categoryStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/by-location', async (req, res) => {
  try {
    const locationStats = await Book.aggregate([
      { $group: {
        _id: '$location',
        total: { $sum: 1 },
        adalyRead: { $sum: { $cond: ['$readingStatus.adaly.read', 1, 0] } },
        sebastianRead: { $sum: { $cond: ['$readingStatus.sebastian.read', 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    res.json(locationStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
