export default function StepIdentity({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const genderOptions = [
    { value: 'M', label: 'Masculino', emoji: '👨' },
    { value: 'F', label: 'Feminino', emoji: '👩' },
  ];

  const lookingForOptions = [
    { value: 'M', label: 'Homens', emoji: '👨' },
    { value: 'F', label: 'Mulheres', emoji: '👩' },
    { value: 'A', label: 'Todos', emoji: '💜' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading mb-2">Quem é você?</h2>
        <p className="text-gray-400 text-sm">O básico para começarmos.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Como quer ser chamado(a)? <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
          placeholder="Seu nome ou apelido"
          className="input-field text-base !py-3"
          maxLength={50}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Data de Nascimento <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          name="date_of_birth"
          value={formData.date_of_birth}
          onChange={handleChange}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} // Min 18 years
          className="input-field text-base !py-3"
          required
        />
      </div>

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
              className={`p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2.5 ${
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

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Tenho interesse em: <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {lookingForOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData({ ...formData, looking_for: opt.value })}
              className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                formData.looking_for === opt.value
                  ? 'border-red-500 bg-red-500/10 text-red-300'
                  : 'border-[rgba(139,92,246,0.15)] bg-[#16162a] text-gray-400 hover:border-[rgba(139,92,246,0.35)]'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
