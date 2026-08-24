import { religionOptions, politicsOptions, childrenOptions } from '../../data/choices';

export default function StepAbout({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading mb-2">Sobre você</h2>
        <p className="text-gray-400 text-sm">Mostre sua personalidade (opcional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
        <textarea
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

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Altura (cm)</label>
        <input
          type="number"
          name="height_cm"
          value={formData.height_cm || ''}
          onChange={handleChange}
          placeholder="Ex: 175"
          min="100"
          max="250"
          className="input-field text-base !py-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Religião</label>
        <select
          name="religion"
          value={formData.religion}
          onChange={handleChange}
          className="input-field text-base !py-3"
        >
          <option value="">Selecione...</option>
          {religionOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Posição Política</label>
        <select
          name="politics"
          value={formData.politics}
          onChange={handleChange}
          className="input-field text-base !py-3"
        >
          <option value="">Selecione...</option>
          {politicsOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Filhos</label>
        <select
          name="children"
          value={formData.children}
          onChange={handleChange}
          className="input-field text-base !py-3"
        >
          <option value="">Selecione...</option>
          {childrenOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
