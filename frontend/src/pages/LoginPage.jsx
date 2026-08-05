import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      // Redireciona para setup se perfil não está completo, senão para discover
      navigate(result.user?.has_profile ? '/discover' : '/profile/setup');
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-red-600/5 blur-[100px]" />
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
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5 glow-purple">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-bold font-heading mb-2">Bem-vindo de volta</h1>
            <p className="text-gray-400">Entre na sua conta OneMatch</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="seu@email.com"
                  className="input-field !pl-12"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Sua senha"
                  className="input-field !pl-12 !pr-12"
                  required
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

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 text-base disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Entrar'
                )}
              </span>
            </button>
          </form>

          {/* Register link */}
          <p className="text-center mt-8 text-gray-400 text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
