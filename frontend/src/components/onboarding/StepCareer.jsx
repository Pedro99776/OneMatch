import { educationOptions } from '../../data/choices';

export default function StepCareer({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading mb-2">Vida Profissional</h2>
        <p className="text-gray-400 text-sm">Sua carreira e educação (opcional)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Escolaridade</label>
        <select
          name="education"
          value={formData.education}
          onChange={handleChange}
          className="input-field text-base !py-3"
        >
          <option value="">Selecione...</option>
          {educationOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Universidade / Faculdade</label>
        <input
          type="text"
          name="university"
          value={formData.university}
          onChange={handleChange}
          placeholder="Ex: USP, PUC"
          className="input-field text-base !py-3"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Profissão / Cargo</label>
        <input
          type="text"
          name="job_title"
          value={formData.job_title}
          onChange={handleChange}
          placeholder="Ex: Engenheiro de Software"
          className="input-field text-base !py-3"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Empresa onde trabalha</label>
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Ex: Google, Nubank"
          className="input-field text-base !py-3"
          maxLength={100}
        />
      </div>
    </div>
  );
}
