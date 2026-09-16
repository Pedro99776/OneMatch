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
    <div className="min-h-dvh flex bg-[#0a0a0f] relative overflow-hidden">
      {/* Esquerda - Branding (Visível apenas em telas grandes) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden border-r border-[rgba(139,92,246,0.15)]"
        style={{ backgroundImage: "url('/auth-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-md text-center animate-fade-in-up">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(168,85,247,0.4)] overflow-hidden">
            <img src="/logo.jpg" alt="OneMatch Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-4xl font-bold font-heading mb-6 leading-tight drop-shadow-lg text-white">
            Bem-vindo de volta ao <br/><span className="gradient-text">OneMatch</span>
          </h2>
          <p className="text-gray-200 text-lg leading-relaxed drop-shadow-md">
            Seu match está esperando. Faça login para continuar a conversa.
          </p>
        </div>
      </div>

      {/* Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col relative min-h-dvh">
        {/* Ambient Background Mobile */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-[-15%] right-[-10%] w-[300px] h-[300px] rounded-full bg-purple-600/5 blur-[80px]" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[300px] h-[300px] rounded-full bg-red-600/5 blur-[80px]" />
        </div>

        {/* Form Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-10 lg:text-left">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-5 glow-purple lg:hidden overflow-hidden shadow-lg border border-purple-500/20">
                <img src="/logo.jpg" alt="OneMatch Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-bold font-heading mb-2">Entrar</h1>
              <p className="text-gray-400">Acesse sua conta OneMatch</p>
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
    </div>
  );
}
