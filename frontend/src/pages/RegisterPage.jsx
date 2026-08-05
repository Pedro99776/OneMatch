import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    date_of_birth: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      date_of_birth: formData.date_of_birth || undefined,
    });
    setIsLoading(false);

    if (result.success) {
      navigate('/profile/setup');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[100px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      {/* Back */}
      <div className="relative z-10 p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </Link>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5 glow-red">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-bold font-heading mb-2">Crie sua conta</h1>
            <p className="text-gray-400">Junte-se ao OneMatch e encontre sua pessoa</p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nome de usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="register-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="seu_usuario"
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Data de nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="register-dob"
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="input-field !pl-12"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="input-field !pl-12 !pr-12"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-100 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="register-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 text-base disabled:opacity-50 !mt-6"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Criar conta'
                )}
              </span>
            </button>
          </form>

          {/* Login link */}
          <p className="text-center mt-8 text-gray-400 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
