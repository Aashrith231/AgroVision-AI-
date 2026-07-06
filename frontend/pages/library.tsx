import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { diseaseLibrary } from "../data/diseaseLibrary";
import { Language } from "../i18n/translations";
import { useTranslation } from "../hooks/useTranslation";
import { diseaseToSlug } from "../utils/disease";

export default function LibraryPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [query, setQuery] = useState("");
  const t = useTranslation(language);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return diseaseLibrary;
    return diseaseLibrary.filter((item) => `${item.name} ${item.crop} ${item.category}`.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <>
      <Head>
        <title>Disease Library | RootSage AI</title>
      </Head>
      <Header brand={t.brand} language={language} setLanguage={setLanguage} />
      <main className="bg-leaf-50">
        <section className="border-b border-leaf-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">36 trained classes</p>
                <h1 className="text-4xl font-black text-leaf-900">Disease Library</h1>
              </div>
            </div>
            <label className="relative mt-7 block max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-leaf-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search crop or disease..."
                className="w-full rounded-2xl border-leaf-200 py-3 pl-12 pr-4 font-semibold focus:border-leaf-600 focus:ring-leaf-600"
              />
            </label>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/disease/${diseaseToSlug(item.id)}?lang=${language}`}
                className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-leaf-600">{item.crop}</p>
                    <h2 className="mt-2 text-xl font-black text-leaf-900">{item.name}</h2>
                  </div>
                  <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-black text-leaf-700">{item.category}</span>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-green-950/68">{item.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer brand={t.brand} />
    </>
  );
}
