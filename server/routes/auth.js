const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        reviewKey: user.reviewKey
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      reviewKey: req.user.reviewKey
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son requeridas' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.post('/setup', async (req, res) => {
  try {
    const existingUsers = await User.countDocuments();
    
    if (existingUsers > 0) {
      return res.status(400).json({ message: 'Los usuarios ya han sido configurados' });
    }
    
    const users = [
      {
        username: 'Admin',
        email: 'admin@nuestrabiblioteca.com',
        password: 'admin123',
        role: 'admin',
        reviewKey: null
      },
      {
        username: 'Adaly',
        email: 'adaly@arcia.net',
        password: 'adaly123',
        role: 'user',
        reviewKey: 'adaly'
      },
      {
        username: 'Sebastian',
        email: 'tatan@rodrigo.lat',
        password: 'sebastian123',
        role: 'user',
        reviewKey: 'sebastian'
      }
    ];
    
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }
    
    res.json({ 
      message: 'Usuarios creados correctamente',
      users: [
        { username: 'Admin', email: 'admin@nuestrabiblioteca.com' },
        { username: 'Adaly', email: 'adaly@arcia.net' },
        { username: 'Sebastian', email: 'tatan@rodrigo.lat' }
      ]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
