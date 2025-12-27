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
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      reviewKey: user.reviewKey,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { email, avatar, bio, username } = req.body;
    const user = await User.findById(req.user._id);
    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email ya está en uso' });
      }
      user.email = email.toLowerCase();
    }
    
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Este nombre de usuario ya está en uso' });
      }
      user.username = username;
    }
    
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    
    await user.save();
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      reviewKey: user.reviewKey,
      avatar: user.avatar,
      bio: user.bio
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
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

router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden ver la lista de usuarios' });
    }
    
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

router.post('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden crear usuarios' });
    }
    
    const { username, email, password, role, reviewKey, avatar, bio } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email y contraseña son requeridos' });
    }
    
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'El email o nombre de usuario ya existe' });
    }
    
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      reviewKey: reviewKey || null,
      avatar: avatar || '',
      bio: bio || ''
    });
    
    await user.save();
    
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      reviewKey: user.reviewKey,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario: ' + error.message });
  }
});

router.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden editar usuarios' });
    }
    
    const { username, email, password, role, reviewKey, avatar, bio } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email ya está en uso' });
      }
      user.email = email.toLowerCase();
    }
    
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Este nombre de usuario ya está en uso' });
      }
      user.username = username;
    }
    
    if (password) user.password = password;
    if (role) user.role = role;
    if (reviewKey !== undefined) user.reviewKey = reviewKey;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    
    await user.save();
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      reviewKey: user.reviewKey,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden eliminar usuarios' });
    }
    
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
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
