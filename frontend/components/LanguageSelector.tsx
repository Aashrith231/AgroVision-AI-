import { Globe2 } from "lucide-react";
import { Language, languages } from "../i18n/translations";

type Props = {
  value: Language;
  onChange: (language: Language) => void;
};

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-leaf-100 bg-white px-3 py-2 text-sm font-medium text-leaf-900 shadow-sm">
      <Globe2 className="h-4 w-4 text-leaf-600" aria-hidden />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Language)}
        className="border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0"
        aria-label="Language"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
