import { Bell, BookOpen, BrainCircuit, CloudSun, History, Languages, ShieldCheck, Sprout } from "lucide-react";

type Props = {
  featuresTitle: string;
  howTitle: string;
  cropsTitle: string;
};

const features = [
  { icon: BrainCircuit, title: "CNN model inference", text: "Loads saved .h5 models and returns top-3 confidence." },
  { icon: Sprout, title: "AI farmer guidance", text: "Gemini first, local Ollama second, and dictionary fallback last." },
  { icon: CloudSun, title: "Local weather risk", text: "Free Open-Meteo weather checks for humidity, rain, heat, and wind." },
  { icon: History, title: "Scan history", text: "Saves recent scans, leaf images, confidence, and advice on this device." },
  { icon: BookOpen, title: "Disease library", text: "Browse all 36 trained classes with detail pages and field checklists." },
  { icon: ShieldCheck, title: "Severity checker", text: "Turns field observations into low, medium, or high severity advice." },
  { icon: Bell, title: "Follow-up reminders", text: "Save a 3-day recheck reminder after diagnosis." },
  { icon: Languages, title: "Three languages", text: "English, Hindi, and Telugu UI with multilingual guidance." }
];

const steps = ["Upload or capture a leaf image", "CNN model predicts disease and confidence", "Gemini prepares farmer-friendly advice", "Listen or share the result on WhatsApp"];
const crops = ["Apple", "Corn", "Grape", "Potato", "Tomato", "Cherry", "Peach", "Pepper", "Strawberry", "Soybean", "Squash", "Orange"];

export function InfoSections({ featuresTitle, howTitle, cropsTitle }: Props) {
  return (
    <>
      <section id="features" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-leaf-900 sm:text-4xl">{featuresTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-leaf-100 bg-leaf-50 p-5">
                <feature.icon className="h-7 w-7 text-leaf-600" />
                <h3 className="mt-4 font-black text-leaf-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-green-950/70">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-leaf-900 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black sm:text-4xl">{howTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/8 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-sunlight font-black text-leaf-950">{index + 1}</div>
                <p className="mt-5 font-bold leading-6">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="crops" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-leaf-900 sm:text-4xl">{cropsTitle}</h2>
          <div className="mt-7 flex flex-wrap gap-3">
            {crops.map((crop) => (
              <span key={crop} className="rounded-full border border-leaf-100 bg-leaf-50 px-4 py-2 text-sm font-bold text-leaf-900">
                {crop}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
