import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { hospitals } from '@/lib/mock-data';

// Mock AI analysis function – returns translation keys
function analyzeSymptoms(symptomText: string) {
  const lower = symptomText.toLowerCase();
  const suggestions: string[] = [];
  const depts: string[] = [];

  if (lower.includes('chest') && lower.includes('pain')) {
    suggestions.push('symptom_suggest_card');
    depts.push('CARD');
  }
  if (lower.includes('fever') && lower.includes('cough')) {
    suggestions.push('symptom_suggest_resp');
    depts.push('ENT', 'PEDIATRIC');
  }
  if (lower.includes('headache')) {
    suggestions.push('symptom_suggest_neuro');
    depts.push('NEURO');
  }
  if (lower.includes('bone') || lower.includes('fracture') || lower.includes('back')) {
    suggestions.push('symptom_suggest_ortho');
    depts.push('ORTHO');
  }
  if (suggestions.length === 0) {
    suggestions.push('symptom_suggest_general');
    depts.push('GENERAL');
  }
  // Urgency heuristic
  const urgency = /chest|shortness|severe|unconscious|blood/.test(lower) ? 'High' : 'Medium';
  return { suggestions, urgency, depts };
}

export const Route = createFileRoute('/patient/symptom-checker')({
  component: SymptomCheckerPage,
});

function SymptomCheckerPage() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ suggestions: string[]; urgency: string; depts: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    // Simulate async AI call
    setTimeout(() => {
      const analysis = analyzeSymptoms(input);
      setResult(analysis);
      setLoading(false);
    }, 800);
  };

  const recommendedHospitals = result
    ? hospitals.filter(h => h.departments.some(d => result.depts.includes(d)))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-background p-6 items-center">
      <section className="w-full max-w-3xl bg-card-glass backdrop-blur-md p-6 rounded-xl shadow-glass">
        <h1 className="text-2xl font-bold mb-4 text-primary">{t('symptomCheckerTitle')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('describeSymptoms')}
            rows={5}
            className="w-full p-3 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? t('analyzing') : t('checkSymptoms')}
          </button>
        </form>
        {result && (
          <div className="mt-6 space-y-3">
            <div className={`p-4 rounded-lg border ${result.urgency === 'High' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <p className="font-semibold text-lg mb-2">
                {t('suggestedUrgency')}: <span className={result.urgency === 'High' ? 'text-red-700' : 'text-orange-700'}>{result.urgency === 'High' ? t('symptom_urgency_high') : t('symptom_urgency_medium')}</span>
              </p>
              <ul className="list-disc list-inside space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{t(s)}</li>
                ))}
              </ul>
            </div>
            
            {recommendedHospitals.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">{t('symptom_recommended_hosps')}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {recommendedHospitals.map(h => (
                    <div key={h.id} className="bg-white rounded-lg border border-border p-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{t(h.name)}</h3>
                        <p className="text-sm text-muted-foreground">{t(h.address)}</p>
                        <p className="text-sm mt-2 text-primary font-medium">{t('symptom_distance_val', { dist: h.distanceKm })}</p>
                      </div>
                      <Link 
                        to="/patient/book" 
                        search={{ hospitalId: h.id }}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded text-center text-sm font-semibold hover:opacity-90"
                      >
                        {t('symptom_select_hosp_btn')}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
