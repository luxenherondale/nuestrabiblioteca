const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bookRoutes = require('./routes/books');
const categoryRoutes = require('./routes/categories');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const importRoutes = require('./routes/import');
const { authMiddleware } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nuestrabiblioteca')
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/books', authMiddleware, bookRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);
app.use('/api/import', authMiddleware, importRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de Nuestra Biblioteca' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
