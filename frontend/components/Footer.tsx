import { BookOpen, History, Leaf, ShieldCheck } from "lucide-react";

export function Footer({ brand }: { brand: string }) {
  return (
    <footer className="border-t border-leaf-100 bg-leaf-50 py-8">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 text-sm text-green-950/68 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-black text-leaf-900">
            <Leaf className="h-5 w-5 text-leaf-600" />
            {brand}
          </div>
          <p className="mt-2 max-w-2xl leading-6">
            AI predictions should be verified with field symptoms before treatment. Use local agriculture expert advice for severe infections and before applying pesticides.
          </p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-green-950/55">
            Privacy: scan history stays on this device only. Uploaded leaf images are analyzed by the server for diagnosis and are not stored in a user account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/library" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-leaf-900">
            <BookOpen className="h-4 w-4 text-leaf-600" />
            Library
          </a>
          <a href="/history" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-leaf-900">
            <History className="h-4 w-4 text-leaf-600" />
            History
          </a>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-leaf-900">
            <ShieldCheck className="h-4 w-4 text-leaf-600" />
            Farmer-safe guidance
          </span>
        </div>
      </div>
    </footer>
  );
}
