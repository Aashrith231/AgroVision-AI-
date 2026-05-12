import { Leaf } from "lucide-react";
import { Language } from "../i18n/translations";
import { LanguageSelector } from "./LanguageSelector";

type Props = {
  brand: string;
  language: Language;
  setLanguage: (language: Language) => void;
};

export function Header({ brand, language, setLanguage }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-leaf-100 bg-white/90 shadow-sm shadow-green-950/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/#top" className="flex items-center gap-2 font-black tracking-tight text-leaf-900">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf-600 text-white shadow-md shadow-green-900/20 transition-transform duration-300 hover:scale-105">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-base sm:text-lg">{brand}</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-leaf-900 md:flex">
          <a className="hover:text-leaf-600" href="/#upload">Upload</a>
          <a className="hover:text-leaf-600" href="/library">Library</a>
          <a className="hover:text-leaf-600" href="/history">History</a>
          <a className="hover:text-leaf-600" href="/#features">Features</a>
          <a className="hover:text-leaf-600" href="/#crops">Crops</a>
        </nav>
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-leaf-100 px-4 py-2 text-sm font-black text-leaf-900 md:hidden">
        <a className="shrink-0 rounded-full bg-leaf-50 px-4 py-2" href="/#upload">Upload</a>
        <a className="shrink-0 rounded-full bg-leaf-50 px-4 py-2" href="/library">Library</a>
        <a className="shrink-0 rounded-full bg-leaf-50 px-4 py-2" href="/history">History</a>
        <a className="shrink-0 rounded-full bg-leaf-50 px-4 py-2" href="/#features">Features</a>
      </nav>
    </header>
  );
}
