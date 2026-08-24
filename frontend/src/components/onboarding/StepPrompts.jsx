import { useState } from 'react';
import { PROMPTS_LIST } from '../../data/promptsList';
import { Plus, X, MessageSquareQuote } from 'lucide-react';

export default function StepPrompts({ formData, setFormData }) {
  const [showPromptList, setShowPromptList] = useState(false);
  
  const prompts = formData.prompts || [];

  const handleAddPrompt = (question) => {
    if (prompts.length >= 3) return;
    const newPrompts = [...prompts, { question, answer: '' }];
    setFormData({ ...formData, prompts: newPrompts });
    setShowPromptList(false);
  };

  const handleRemovePrompt = (index) => {
    const newPrompts = prompts.filter((_, i) => i !== index);
    setFormData({ ...formData, prompts: newPrompts });
  };

  const handleAnswerChange = (index, value) => {
    const newPrompts = [...prompts];
    newPrompts[index].answer = value;
    setFormData({ ...formData, prompts: newPrompts });
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-heading mb-2">Sua Voz</h2>
        <p className="text-gray-400 text-sm">Escolha até 3 perguntas para responder</p>
      </div>

      <div className="space-y-4">
        {prompts.map((prompt, index) => (
          <div key={index} className="bg-[#16162a] border border-[rgba(139,92,246,0.3)] rounded-2xl p-5 relative group shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <button
              onClick={() => handleRemovePrompt(index)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold text-purple-300 mb-3 pr-8">{prompt.question}</h3>
            <textarea
              value={prompt.answer}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Sua resposta..."
              className="w-full bg-transparent border-none p-0 text-gray-200 placeholder-gray-500 focus:ring-0 resize-none h-20 text-lg"
              maxLength={500}
            />
          </div>
        ))}

        {prompts.length < 3 && !showPromptList && (
          <button
            type="button"
            onClick={() => setShowPromptList(true)}
            className="w-full py-6 rounded-2xl border-2 border-dashed border-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.5)] bg-[#16162a]/50 hover:bg-[#16162a] transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm font-medium text-purple-400">Adicionar Pergunta</span>
          </button>
        )}
      </div>

      {/* Modal with Prompts List */}
      {showPromptList && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in" onClick={() => setShowPromptList(false)}>
          <div className="bg-[#0a0a0f] rounded-t-3xl w-full max-h-[80vh] flex flex-col border-t border-[rgba(139,92,246,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[rgba(139,92,246,0.1)] flex justify-between items-center">
              <h3 className="text-xl font-bold font-heading">Escolha uma Pergunta</h3>
              <button onClick={() => setShowPromptList(false)} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-2 pb-10">
              {PROMPTS_LIST.filter(q => !prompts.some(p => p.question === q)).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddPrompt(question)}
                  className="w-full text-left p-4 rounded-xl bg-[#16162a] hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-colors flex items-start gap-3"
                >
                  <MessageSquareQuote className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-200">{question}</span>
                </button>
              ))}
              {PROMPTS_LIST.filter(q => !prompts.some(p => p.question === q)).length === 0 && (
                <p className="text-center text-gray-500 py-10">Você já usou todas as perguntas!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
