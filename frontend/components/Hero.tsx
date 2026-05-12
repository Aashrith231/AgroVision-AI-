import { motion } from "framer-motion";
import { Camera, CheckCircle2, Languages, MessageCircle, Mic2, ShieldCheck, Sparkles, Sprout } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
};

export function Hero({ title, subtitle }: Props) {
  return (
    <section id="top" className="relative overflow-hidden bg-leaf-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(247,183,51,0.18),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(34,197,94,0.12),transparent_28%),linear-gradient(135deg,rgba(34,197,94,0.15),rgba(240,253,244,0.76)_48%,rgba(255,255,255,0.86))]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-9 sm:px-6 sm:py-12 lg:min-h-[68vh] lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-leaf-100 bg-white px-4 py-2 text-sm font-bold text-leaf-700 shadow-sm">
            <Sparkles className="h-4 w-4 text-sunlight" aria-hidden />
            CNN diagnosis with farmer guidance
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.04] text-leaf-900 sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-green-950/78 sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#upload" className="rounded-full bg-leaf-600 px-6 py-3 font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-leaf-700">
              Start diagnosis
            </a>
            <a href="#how" className="rounded-full border border-leaf-200 bg-white px-6 py-3 font-bold text-leaf-900 transition hover:border-leaf-500">
              How it works
            </a>
          </div>
          <div className="mt-7 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
            <HeroStat value="36" label="trained classes" />
            <HeroStat value="3" label="languages" />
            <HeroStat value="Top-3" label="CNN confidence" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-panel rounded-[1.75rem] p-3 shadow-soft sm:p-4"
        >
          <div className="overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-leaf-900 via-leaf-700 to-soil p-4 text-white sm:p-5">
            <div className="rounded-2xl bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] p-3 sm:aspect-[4/3] sm:p-5">
              <div className="grid h-full grid-cols-2 gap-3">
                <FeatureTile icon={Camera} title="Leaf image" text="JPG or PNG scan" />
                <FeatureTile icon={Sparkles} title="CNN result" text="Top-3 confidence" />
                <FeatureTile icon={Mic2} title="Voice help" text="Local language" />
                <FeatureTile icon={MessageCircle} title="WhatsApp" text="Share advice" />
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-black text-leaf-900">
                <ShieldCheck className="h-4 w-4 text-leaf-600" />
                Confidence bands
              </div>
              <p className="mt-1 text-xs leading-5 text-green-950/62">High, uncertain, and out-of-dataset warnings.</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-black text-leaf-900">
                <Languages className="h-4 w-4 text-leaf-600" />
                Local advice
              </div>
              <p className="mt-1 text-xs leading-5 text-green-950/62">English, Hindi, and Telugu farmer guidance.</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-black text-leaf-900">
                <Sprout className="h-4 w-4 text-leaf-600" />
                Field ready
              </div>
              <p className="mt-1 text-xs leading-5 text-green-950/62">Treatment, prevention, voice, and sharing.</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative border-y border-leaf-100 bg-white/72 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-2xl bg-leaf-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf-600" />
            <span className="text-sm font-bold text-leaf-900">Detect disease before it spreads</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-leaf-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf-600" />
            <span className="text-sm font-bold text-leaf-900">Simple treatment steps for farmers</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-leaf-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-leaf-600" />
            <span className="text-sm font-bold text-leaf-900">Share results instantly on WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-leaf-100 bg-white/82 px-3 py-3 shadow-sm backdrop-blur">
      <p className="text-lg font-black text-leaf-900 sm:text-xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-950/58">{label}</p>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  text
}: {
  icon: typeof Camera;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[8.5rem] flex-col justify-between rounded-2xl bg-white/14 p-4 sm:min-h-0">
      <Icon className="h-8 w-8" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-white/76">{text}</p>
      </div>
    </div>
  );
}
