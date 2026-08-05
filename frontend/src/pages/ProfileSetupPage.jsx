import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetupPage() {
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    gender: '',
    looking_for: '',
    city: '',
    state: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.display_name || !formData.gender || !formData.looking_for || !formData.city || !formData.state) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    const result = await updateProfile(formData);
    setIsLoading(false);

    if (result.success) {
      navigate('/discover');
    } else {
      setError('Erro ao salvar perfil. Tente novamente.');
    }
  };

  const genderOptions = [
    { value: 'M', label: 'Masculino', emoji: '👨' },
    { value: 'F', label: 'Feminino', emoji: '👩' },
    { value: 'NB', label: 'Não-binário', emoji: '🧑' },
    { value: 'O', label: 'Outro', emoji: '✨' },
  ];

  const lookingForOptions = [
    { value: 'M', label: 'Homens', emoji: '👨' },
    { value: 'F', label: 'Mulheres', emoji: '👩' },
    { value: 'A', label: 'Todos', emoji: '💜' },
  ];

  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[300px] h-[300px] rounded-full bg-red-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-5 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Configure seu perfil</span>
            </div>
            <h1 className="text-3xl font-bold font-heading mb-2">Conte sobre você</h1>
            <p className="text-gray-400">Essas informações serão visíveis para outros usuários</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nome de exibição <span className="text-red-400">*</span>
              </label>
              <input
                id="setup-display-name"
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Como você quer ser chamado(a)?"
                className="input-field"
                maxLength={50}
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea
                id="setup-bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Fale um pouco sobre você..."
                className="input-field resize-none h-24"
                maxLength={500}
              />
              <span className="text-xs text-gray-500 mt-1 block text-right">
                {formData.bio.length}/500
              </span>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Gênero <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: opt.value })}
                    className={`p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2.5 ${
                      formData.gender === opt.value
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-[rgba(139,92,246,0.15)] bg-[#16162a] text-gray-400 hover:border-[rgba(139,92,246,0.35)]'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Looking For */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Interessado em <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {lookingForOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, looking_for: opt.value })}
                    className={`p-3.5 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1.5 ${
                      formData.looking_for === opt.value
                        ? 'border-red-500 bg-red-500/10 text-red-300'
                        : 'border-[rgba(139,92,246,0.15)] bg-[#16162a] text-gray-400 hover:border-[rgba(139,92,246,0.35)]'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City & State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Cidade <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="setup-city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Sua cidade"
                    className="input-field !pl-10 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Estado <span className="text-red-400">*</span>
                </label>
                <input
                  id="setup-state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Ex: SP"
                  className="input-field text-sm"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="setup-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3.5 text-base disabled:opacity-50 group"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Começar a explorar
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
