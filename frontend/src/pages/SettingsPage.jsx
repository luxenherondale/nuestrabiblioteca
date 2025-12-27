import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Camera, Save, Key, Users, Plus, Edit, Trash2, X, Shield, BookOpen, Upload, Link } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';
import './SettingsPage.css';

const API_URL = 'http://localhost:5000';

const SettingsPage = () => {
  const { user, token, isAdmin, updateProfile, changePassword, getUsers, createUser, updateUser, deleteUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [avatarMode, setAvatarMode] = useState('url');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const userFileInputRef = useRef(null);
  
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    avatar: '',
    bio: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [userModal, setUserModal] = useState({ open: false, mode: 'create', user: null });
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    reviewKey: '',
    avatar: '',
    bio: ''
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      loadUsers();
    }
  }, [isAdmin, activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAvatarUpload = async (file, isUserModal = false) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setUploadingAvatar(true);
    try {
      const response = await axios.post(`${API_URL}/api/upload/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      const avatarUrl = `${API_URL}${response.data.avatarUrl}`;
      
      if (isUserModal) {
        setUserForm(prev => ({ ...prev, avatar: avatarUrl }));
      } else {
        setProfileForm(prev => ({ ...prev, avatar: avatarUrl }));
      }
      
      setMessage({ type: 'success', text: 'Imagen subida correctamente' });
      return avatarUrl;
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al subir imagen' });
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileChange = (e, isUserModal = false) => {
    const file = e.target.files[0];
    if (file) {
      handleAvatarUpload(file, isUserModal);
    }
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${API_URL}${avatar}`;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateProfile(profileForm);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    
    if (passwordForm.new.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    
    setSaving(true);
    try {
      await changePassword(passwordForm.current, passwordForm.new);
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const openUserModal = (mode, userData = null) => {
    if (mode === 'edit' && userData) {
      setUserForm({
        username: userData.username || '',
        email: userData.email || '',
        password: '',
        role: userData.role || 'user',
        reviewKey: userData.reviewKey || '',
        avatar: userData.avatar || '',
        bio: userData.bio || ''
      });
    } else {
      setUserForm({
        username: '',
        email: '',
        password: '',
        role: 'user',
        reviewKey: '',
        avatar: '',
        bio: ''
      });
    }
    setUserModal({ open: true, mode, user: userData });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (userModal.mode === 'create') {
        await createUser(userForm);
        setMessage({ type: 'success', text: 'Usuario creado correctamente' });
      } else {
        const updateData = { ...userForm };
        if (!updateData.password) delete updateData.password;
        await updateUser(userModal.user._id, updateData);
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      }
      setUserModal({ open: false, mode: 'create', user: null });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) return;
    
    try {
      await deleteUser(userId);
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente' });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Configuración</h1>
        <p>Administra tu cuenta y preferencias</p>
      </div>

      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User className="w-4 h-4" />
          Mi Perfil
        </button>
        <button 
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Key className="w-4 h-4" />
          Seguridad
        </button>
        {isAdmin && (
          <button 
            className={`settings-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
        )}
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="settings-form">
            <div className="profile-header-section">
              <div className="avatar-section">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="Avatar" className="avatar-preview" />
                ) : (
                  <div className="avatar-placeholder">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <div className="avatar-info">
                  <h3>{user?.username}</h3>
                  <span className="role-badge">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                  <p className="member-since">Miembro desde {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><Camera className="w-4 h-4" /> Foto de Perfil</h3>
              
              <div className="avatar-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn ${avatarMode === 'url' ? 'active' : ''}`}
                  onClick={() => setAvatarMode('url')}
                >
                  <Link className="w-4 h-4" />
                  URL
                </button>
                <button
                  type="button"
                  className={`mode-btn ${avatarMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setAvatarMode('upload')}
                >
                  <Upload className="w-4 h-4" />
                  Subir archivo
                </button>
              </div>

              {avatarMode === 'url' ? (
                <div className="form-group">
                  <label>URL de la imagen</label>
                  <input
                    type="url"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="https://ejemplo.com/mi-foto.jpg"
                  />
                  <span className="form-hint">Ingresa la URL de una imagen para tu foto de perfil</span>
                </div>
              ) : (
                <div className="form-group">
                  <label>Subir imagen</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleFileChange(e, false)}
                    className="file-input-hidden"
                    id="avatar-upload"
                  />
                  <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                    {uploadingAvatar ? (
                      <div className="upload-loading">
                        <div className="spinner"></div>
                        <span>Subiendo...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span>Haz clic para seleccionar una imagen</span>
                        <span className="upload-hint">JPEG, PNG, GIF o WebP. Máximo 5MB</span>
                      </>
                    )}
                  </div>
                  {profileForm.avatar && (
                    <div className="current-avatar-info">
                      <span>Imagen actual:</span>
                      <span className="avatar-url-preview">{profileForm.avatar.split('/').pop()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-section">
              <h3><User className="w-4 h-4" /> Información Personal</h3>
              <div className="form-group">
                <label>Nombre de usuario</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label><Mail className="w-4 h-4" /> Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Biografía</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Cuéntanos sobre ti..."
                  rows={3}
                  maxLength={500}
                />
                <span className="form-hint">{profileForm.bio.length}/500 caracteres</span>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="settings-form">
            <div className="form-section">
              <h3><Key className="w-4 h-4" /> Cambiar Contraseña</h3>
              <div className="form-group">
                <label>Contraseña actual</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  required
                  minLength={6}
                />
                <span className="form-hint">Mínimo 6 caracteres</span>
              </div>
              <div className="form-group">
                <label>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              <Key className="w-4 h-4" />
              {saving ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}

        {activeTab === 'users' && isAdmin && (
          <div className="users-section">
            <div className="users-header">
              <h3><Users className="w-5 h-5" /> Gestión de Usuarios</h3>
              <button className="btn-primary" onClick={() => openUserModal('create')}>
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            </div>

            {loadingUsers ? (
              <div className="loading-users">Cargando usuarios...</div>
            ) : (
              <div className="users-list">
                {users.map(u => (
                  <div key={u._id} className="user-card">
                    <div className="user-card-avatar">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.username} />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    <div className="user-card-info">
                      <div className="user-card-name">
                        {u.username}
                        {u.role === 'admin' && <Shield className="w-4 h-4 admin-icon" />}
                      </div>
                      <div className="user-card-email">{u.email}</div>
                      <div className="user-card-meta">
                        <span className={`role-tag ${u.role}`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                        {u.reviewKey && (
                          <span className="review-key-tag">
                            <BookOpen className="w-3 h-3" />
                            {u.reviewKey}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="user-card-actions">
                      <button 
                        className="btn-icon edit"
                        onClick={() => openUserModal('edit', u)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {u._id !== user.id && (
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {userModal.open && (
        <div className="modal-overlay" onClick={() => setUserModal({ open: false, mode: 'create', user: null })}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h3>{userModal.mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}</h3>
              <button 
                className="modal-close"
                onClick={() => setUserModal({ open: false, mode: 'create', user: null })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="user-modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de usuario *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña {userModal.mode === 'create' ? '*' : '(dejar vacío para mantener)'}</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    required={userModal.mode === 'create'}
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Clave de Reseña</label>
                  <select
                    value={userForm.reviewKey}
                    onChange={(e) => setUserForm(prev => ({ ...prev, reviewKey: e.target.value }))}
                  >
                    <option value="">Ninguna</option>
                    <option value="adaly">Adaly</option>
                    <option value="sebastian">Sebastian</option>
                  </select>
                  <span className="form-hint">Permite editar reseñas de este usuario</span>
                </div>
                <div className="form-group">
                  <label>Avatar</label>
                  <div className="user-avatar-options">
                    <input
                      type="url"
                      value={userForm.avatar}
                      onChange={(e) => setUserForm(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="URL o subir archivo..."
                    />
                    <input
                      type="file"
                      ref={userFileInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => handleFileChange(e, true)}
                      className="file-input-hidden"
                    />
                    <button
                      type="button"
                      className="btn-upload-small"
                      onClick={() => userFileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? '...' : <Upload className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Biografía</label>
                <textarea
                  value={userForm.bio}
                  onChange={(e) => setUserForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div className="user-modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setUserModal({ open: false, mode: 'create', user: null })}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (userModal.mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
