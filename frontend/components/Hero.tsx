import { motion } from "framer-motion";
import { ArrowRight, Camera, CheckCircle2, CloudSun, History, Languages, MessageCircle, Mic2, ShieldCheck } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
};

const fieldImage =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=82";

export function Hero({ title, subtitle }: Props) {
  return (
    <section id="top" className="border-b border-[#dde7d8] bg-[#f7f8f1]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col justify-center"
        >
          <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-700">Plant health intelligence</p>
          <h1 className="mt-5 max-w-3xl text-[2.65rem] font-black leading-[1.02] text-[#14351f] sm:text-6xl lg:text-[4.75rem]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#33483a] sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#upload"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#184f2b] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#11381f]"
            >
              Start diagnosis
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-md border border-[#b9cbb4] bg-white px-5 py-3 text-sm font-black text-[#184f2b] transition hover:border-[#184f2b]"
            >
              View workflow
            </a>
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-3 border-y border-[#d8e3d3]">
            <HeroMetric value="36" label="trained classes" />
            <HeroMetric value="3" label="languages" />
            <HeroMetric value="24/7" label="field access" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="min-w-0"
        >
          <div className="overflow-hidden rounded-lg border border-[#d7e3d1] bg-white shadow-[0_24px_60px_rgba(20,53,31,0.12)]">
            <div
              className="relative min-h-[22rem] bg-cover bg-center sm:min-h-[30rem]"
              style={{ backgroundImage: `url(${fieldImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/16 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-md bg-white p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6b7e70]">Current scan</p>
                        <h2 className="mt-1 text-xl font-black text-[#14351f]">Leaf image ready</h2>
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-md bg-[#e9f4e7] text-[#184f2b]">
                        <Camera className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-[#33483a]">
                      <StatusLine icon={ShieldCheck} text="CNN model" />
                      <StatusLine icon={CloudSun} text="Weather risk" />
                      <StatusLine icon={Mic2} text="Voice output" />
                      <StatusLine icon={MessageCircle} text="WhatsApp" />
                    </div>
                  </div>

                  <div className="rounded-md bg-[#163b23] p-4 text-white shadow-lg">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Farmer workflow</p>
                    <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-white/86">
                      <StatusLine icon={CheckCircle2} text="Capture a clear leaf" inverse />
                      <StatusLine icon={CheckCircle2} text="Read treatment steps" inverse />
                      <StatusLine icon={CheckCircle2} text="Save scan history" inverse />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="border-t border-[#dde7d8] bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#dde7d8] px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <TrustItem icon={Camera} title="Camera first" text="Works from phone camera or desktop upload." />
          <TrustItem icon={Languages} title="Local guidance" text="Advice can be generated in English, Hindi, or Telugu." />
          <TrustItem icon={History} title="Decision record" text="Recent scans, advice, and reminders stay on the device." />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="py-4 pr-4">
      <p className="text-2xl font-black text-[#14351f]">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[#647568]">{label}</p>
    </div>
  );
}

function StatusLine({
  icon: Icon,
  text,
  inverse
}: {
  icon: typeof Camera;
  text: string;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${inverse ? "text-[#cde8bd]" : "text-[#184f2b]"}`} />
      <span>{text}</span>
    </div>
  );
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof Camera; title: string; text: string }) {
  return (
    <div className="flex gap-3 py-5 md:px-5 first:md:pl-0 last:md:pr-0">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#e9f4e7] text-[#184f2b]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-black text-[#14351f]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#506155]">{text}</p>
      </div>
    </div>
  );
}
