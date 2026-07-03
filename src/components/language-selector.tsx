import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();
  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
      <SelectTrigger className="w-28">
        <SelectValue placeholder={t("language")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="hi">हिन्दी</SelectItem>
        <SelectItem value="te">తెలుగు</SelectItem>
      </SelectContent>
    </Select>
  );
}
