import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import OnboardingProgressBar from '../components/onboarding/OnboardingProgressBar';
import StepIdentity from '../components/onboarding/StepIdentity';
import StepAbout from '../components/onboarding/StepAbout';
import StepCareer from '../components/onboarding/StepCareer';
import StepPhotos from '../components/onboarding/StepPhotos';
import StepPrompts from '../components/onboarding/StepPrompts';
import StepFilters from '../components/onboarding/StepFilters';

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    display_name: '',
    date_of_birth: '',
    gender: '',
    looking_for: '',
    bio: '',
    height_cm: '',
    religion: '',
    politics: '',
    children: '',
    education: '',
    university: '',
    job_title: '',
    company: '',
    photos: Array(6).fill(null), // Array of { file, preview, caption, is_primary }
    prompts: [], // Array of { question, answer }
    city: '',
    state: '',
    latitude: null,
    longitude: null,
    max_distance_km: 50,
    min_age_preference: 18,
    max_age_preference: 99,
    filter_min_height: '',
    filter_max_height: '',
    filter_education: [],
    filter_religion: [],
    filter_politics: [],
  });

  const totalSteps = 6;

  const validateStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.display_name || !formData.date_of_birth || !formData.gender || !formData.looking_for) {
        setError('Preencha todos os campos obrigatórios.');
        return false;
      }
    }
    if (currentStep === 6) {
      if (!formData.city || !formData.state) {
        setError('Por favor, informe sua localização.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      window.scrollTo(0, 0);
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setError('');
    window.scrollTo(0, 0);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);

    try {
      // 1. Atualizar Profile
      // Removendo campos que não vão pro profile model (date_of_birth, photos, prompts)
      const { date_of_birth, photos, prompts, ...profileData } = formData;
      
      // Converte vazios de height para null pra não bugar BD numérico
      if (profileData.height_cm === '') profileData.height_cm = null;
      if (profileData.filter_min_height === '') profileData.filter_min_height = null;
      if (profileData.filter_max_height === '') profileData.filter_max_height = null;

      const profileResult = await updateProfile(profileData);
      
      if (!profileResult.success) throw new Error('Erro ao salvar perfil');

      // 2. Atualizar Date of Birth (vai pro CustomUser)
      await profileAPI.updateDateOfBirth(date_of_birth);

      // 3. Upload Fotos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.file) {
          const fd = new FormData();
          fd.append('image', photo.file);
          fd.append('is_primary', photo.is_primary ? 'true' : 'false');
          if (photo.caption) fd.append('caption', photo.caption);
          await profileAPI.uploadPhoto(fd);
        }
      }

      // 4. Salvar Prompts
      for (const prompt of prompts) {
        if (prompt.question && prompt.answer) {
          await profileAPI.createPrompt({ question: prompt.question, answer: prompt.answer });
        }
      }

      navigate('/discover');
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar o perfil. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[300px] h-[300px] rounded-full bg-red-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 py-8">
        <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
          
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Configure seu perfil</span>
            </div>
          </div>

          <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in text-center">
              {error}
            </div>
          )}

          <div className="flex-1">
            {currentStep === 1 && <StepIdentity formData={formData} setFormData={setFormData} />}
            {currentStep === 2 && <StepAbout formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && <StepCareer formData={formData} setFormData={setFormData} />}
            {currentStep === 4 && <StepPhotos formData={formData} setFormData={setFormData} />}
            {currentStep === 5 && <StepPrompts formData={formData} setFormData={setFormData} />}
            {currentStep === 6 && <StepFilters formData={formData} setFormData={setFormData} />}
          </div>

          <div className="mt-10 flex gap-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={isLoading}
                className="w-14 h-14 shrink-0 rounded-xl bg-[#16162a] border border-[rgba(139,92,246,0.15)] flex items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex-1 !py-3.5 text-base group"
              >
                <span className="flex items-center justify-center gap-2">
                  Continuar
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex-1 !py-3.5 text-base group"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Começar a explorar
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
