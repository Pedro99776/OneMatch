export default function OnboardingProgressBar({ currentStep, totalSteps }) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
          Passo {currentStep} de {totalSteps}
        </span>
        <span className="text-xs font-semibold text-gray-400">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-[#16162a] rounded-full h-1.5 overflow-hidden border border-[rgba(139,92,246,0.1)]">
        <div 
          className="bg-gradient-to-r from-purple-600 to-red-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
