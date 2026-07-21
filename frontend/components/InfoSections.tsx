import { Bell, BookOpen, BrainCircuit, CloudSun, History, Languages, ShieldCheck, Sprout } from "lucide-react";

type Props = {
  featuresTitle: string;
  howTitle: string;
  cropsTitle: string;
};

const features = [
  { icon: BrainCircuit, title: "Saved CNN models", text: "Runs trained .h5 models for fast image classification." },
  { icon: Sprout, title: "Farmer guidance", text: "Treatment, symptoms, prevention, and plain-language next steps." },
  { icon: CloudSun, title: "Weather context", text: "Local risk signals from humidity, rainfall, heat, and wind." },
  { icon: History, title: "Scan history", text: "Recent diagnoses and reminders are stored on this device." },
  { icon: BookOpen, title: "Disease library", text: "Reference pages for trained classes and field checklists." },
  { icon: ShieldCheck, title: "Severity support", text: "Observation-based severity helps prioritize treatment." },
  { icon: Bell, title: "Follow-up reminders", text: "Save a recheck task after treatment or crop cleanup." },
  { icon: Languages, title: "Multilingual access", text: "English, Hindi, and Telugu support for farmer workflows." }
];

const steps = [
  { title: "Capture", text: "Take one clear leaf photo in natural light." },
  { title: "Analyze", text: "The selected CNN model identifies the closest trained class." },
  { title: "Act", text: "Guidance explains symptoms, prevention, and treatment." },
  { title: "Share", text: "Send the result by WhatsApp or keep it in scan history." }
];

const crops = ["Apple", "Corn", "Grape", "Potato", "Tomato", "Cherry", "Peach", "Pepper", "Strawberry", "Soybean", "Squash", "Orange", "Camphor", "Haritaki", "Neem", "Sojina"];

export function InfoSections({ featuresTitle, howTitle, cropsTitle }: Props) {
  return (
    <>
      <section id="features" className="border-y border-[#dde7d8] bg-[#f7f8f1] py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-700">Platform modules</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-[#14351f] sm:text-4xl">{featuresTitle}</h2>
              <p className="mt-4 text-base leading-7 text-[#506155]">
                The product surface is organized around the actual field decision: capture, diagnose, understand, share, and follow up.
              </p>
            </div>
            <div className="grid border border-[#d7e3d1] bg-white sm:grid-cols-2">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className={`border-[#d7e3d1] p-5 ${index < 6 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""}`}
                >
                  <feature.icon className="h-6 w-6 text-[#184f2b]" />
                  <h3 className="mt-4 font-black text-[#14351f]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#506155]">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#17351f] py-14 text-white sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#cde8bd]">Workflow</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">{howTitle}</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/68">
              Designed for short field sessions where the user needs a result, practical advice, and a way to share it quickly.
            </p>
          </div>

          <div className="mt-8 grid border border-white/14 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className={`p-5 ${index < steps.length - 1 ? "border-b border-white/14 md:border-b-0 md:border-r" : ""}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#cde8bd]">0{index + 1}</p>
                <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="crops" className="bg-white py-14 sm:py-18">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-700">Training coverage</p>
            <h2 className="mt-3 text-3xl font-black text-[#14351f] sm:text-4xl">{cropsTitle}</h2>
            <p className="mt-4 text-sm leading-6 text-[#506155]">40 trained disease classes</p>
          </div>
          <div className="grid grid-cols-2 border border-[#d7e3d1] sm:grid-cols-3 lg:grid-cols-4">
            {crops.map((crop, index) => (
              <span
                key={crop}
                className={`px-4 py-4 text-sm font-black text-[#14351f] ${
                  index < 8 ? "border-b" : ""
                } border-[#d7e3d1] ${index % 4 !== 3 ? "lg:border-r" : ""} ${index % 3 !== 2 ? "sm:border-r lg:border-r" : ""}`}
              >
                {crop}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
