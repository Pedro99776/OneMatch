import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, email, username, is_premium, has_profile }
  const [profile, setProfile] = useState(null);  // Profile completo (display_name, bio, etc.)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = !!user;

  // Carrega perfil completo do usuário logado
  const loadProfile = useCallback(async () => {
    try {
      const { data } = await profileAPI.getMe();
      setProfile(data);
      return data;
    } catch (err) {
      // Profile pode não existir ainda (primeiro login)
      if (err.response?.status === 404) {
        setProfile(null);
      }
      return null;
    }
  }, []);

  // Verifica se há token salvo e reidrata o estado ao montar
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Busca dados do usuário usando o token armazenado
          const { data: userData } = await authAPI.getMe();
          setUser(userData);

          // Tenta carregar o perfil completo também
          await loadProfile();
        } catch {
          // Token inválido/expirado — limpa tudo
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [loadProfile]);

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });

      // Armazena tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      // Seta dados do usuário retornados pelo JWT customizado
      setUser(data.user);

      // Carrega perfil completo
      await loadProfile();

      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Credenciais inválidas.';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      await authAPI.register(userData);
      // Faz login automático após cadastro
      const result = await login(userData.email, userData.password);
      return result;
    } catch (err) {
      const errors = err.response?.data;
      let msg = 'Erro ao cadastrar.';
      if (errors) {
        const firstKey = Object.keys(errors)[0];
        msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
      }
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data) => {
    try {
      const { data: updated } = await profileAPI.patchMe(data);
      setProfile(updated);
      // Atualiza has_profile no user, pois agora tem perfil completo
      setUser((prev) => prev ? { ...prev, has_profile: true } : prev);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.response?.data };
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    loadProfile,
    updateProfile,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
