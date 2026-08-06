import { Heart, Shield, Sparkles, ArrowRight, Users, MessageCircleHeart } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!loading && isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f] overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-purple-500/[0.03] blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <Heart className="w-7 h-7 text-red-400 fill-red-400" />
          <span className="text-xl font-bold font-heading gradient-text">OneMatch</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary !py-2.5 !px-5 text-sm">
            <span>Entrar</span>
          </Link>
          <Link to="/register" className="btn-primary !py-2.5 !px-5 text-sm">
            <span>Cadastrar</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-gray-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Uma nova forma de se conectar</span>
          </div>

          {/* Main Heart Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto rounded-full gradient-bg flex items-center justify-center animate-pulse-glow">
              <Heart className="w-12 h-12 text-white fill-white animate-heartbeat" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full gradient-bg opacity-20 blur-xl" />
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold font-heading leading-tight mb-6">
            Cada conexão{' '}
            <span className="gradient-text">importa</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            No OneMatch, você tem <strong className="text-gray-100">apenas um match por vez</strong>.
            Sem distrações, sem acúmulo de conversas. Foque em quem realmente importa.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg !px-8 !py-4 group">
              <span className="flex items-center gap-2">
                Começar agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link to="/login" className="btn-secondary text-lg !px-8 !py-4">
              <span>Já tenho conta</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-heading">
          Como funciona?
        </h2>
        <p className="text-center text-gray-400 mb-16 max-w-xl mx-auto">
          Simples, intencional e genuíno. Três passos para uma conexão real.
        </p>

        <div className="grid md:grid-cols-3 gap-8 stagger-children">
          {/* Step 1 */}
          <div className={`card p-8 text-center transition-all duration-700 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="w-16 h-16 rounded-2xl bg-purple-600/[0.15] flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Explore perfis</h3>
            <p className="text-gray-400 leading-relaxed">
              Navegue por perfis que combinam com você. Dê like em quem te interessar.
            </p>
          </div>

          {/* Step 2 */}
          <div className={`card p-8 text-center transition-all duration-700 delay-150 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="w-16 h-16 rounded-2xl bg-red-600/[0.15] flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Match único</h3>
            <p className="text-gray-400 leading-relaxed">
              Quando o like é mútuo, vocês dão match! E esse é o seu <strong className="text-gray-100">único</strong> match.
            </p>
          </div>

          {/* Step 3 */}
          <div className={`card p-8 text-center transition-all duration-700 delay-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="w-16 h-16 rounded-2xl bg-purple-600/[0.15] flex items-center justify-center mx-auto mb-6">
              <MessageCircleHeart className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Converse de verdade</h3>
            <p className="text-gray-400 leading-relaxed">
              Toda sua atenção em uma pessoa. Sem 50 conversas abertas. Conexão real.
            </p>
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="glass-strong rounded-3xl p-10 md:p-14">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading">
              Por que <span className="gradient-text">OneMatch</span>?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: '💜', title: 'Foco total', desc: 'Um match por vez. Toda sua atenção em quem importa.' },
              { icon: '🔥', title: 'Conexões reais', desc: 'Sem acumular matches que nunca viram conversa.' },
              { icon: '🛡️', title: 'Sem pressão', desc: 'Converse no seu ritmo. Sem 100 notificações.' },
              { icon: '✨', title: 'Intencionalidade', desc: 'Cada like é pensado, cada match é valorizado.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 px-6 py-20 text-center max-w-3xl mx-auto">
        <div className="animate-float">
          <Heart className="w-16 h-16 text-red-400 fill-red-400 mx-auto mb-6 opacity-80" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
          Pronto para encontrar <span className="gradient-text">sua pessoa</span>?
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          Junte-se a milhares de pessoas que escolheram conexões de qualidade.
        </p>
        <Link to="/register" className="btn-primary text-lg !px-10 !py-4">
          <span>Criar minha conta grátis</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(139,92,246,0.15)] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400 fill-red-400" />
            <span className="font-semibold gradient-text">OneMatch</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 OneMatch. Cada conexão importa.
          </p>
        </div>
      </footer>
    </div>
  );
}
