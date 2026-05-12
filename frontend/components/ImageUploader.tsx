import Image from "next/image";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, CheckCircle2, ImagePlus, Loader2, UploadCloud } from "lucide-react";

type Props = {
  title: string;
  hint: string;
  captureLabel: string;
  predictLabel: string;
  isLoading: boolean;
  previewUrl: string | null;
  onFile: (file: File) => void;
  onPredict: () => void;
};

export function ImageUploader({ title, hint, captureLabel, predictLabel, isLoading, previewUrl, onFile, onPredict }: Props) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const [file] = acceptedFiles;
    if (file) onFile(file);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    multiple: false
  });

  return (
    <section id="upload" className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-leaf-600">Plant diagnosis</p>
            <h2 className="mt-3 text-3xl font-black text-leaf-900 sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-green-950/70">
              {hint}
            </p>
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              <UploadTip text="Use one clear leaf photo in natural light." />
              <UploadTip text="Keep the leaf centered and avoid heavy blur." />
              <UploadTip text="Works from phone camera or saved gallery." />
              <UploadTip text="Shows the predicted disease and possible alternatives." />
            </div>
          </div>

          <div className="rounded-3xl border border-leaf-100 bg-leaf-50 p-4 shadow-soft sm:p-5">
            <div
              {...getRootProps()}
              className={`relative grid min-h-[18rem] cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed p-5 text-center transition ${
                isDragActive ? "border-leaf-600 bg-leaf-100" : "border-leaf-200 bg-white"
              }`}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <Image src={previewUrl} alt="Leaf preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              ) : (
                <div className="mx-auto max-w-sm">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-100 text-leaf-700">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-lg font-black text-leaf-900">{hint}</p>
                  <p className="mt-2 text-sm text-green-950/60">JPG, PNG</p>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-leaf-200 bg-white px-4 py-3 font-bold text-leaf-900 transition hover:border-leaf-500">
                <Camera className="h-5 w-5" />
                {captureLabel}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onFile(file);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={onPredict}
                disabled={isLoading || !previewUrl}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-4 py-3 font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                {predictLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UploadTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-leaf-100 bg-leaf-50 px-3 py-3 text-sm font-semibold leading-6 text-green-950/72">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" />
      <span>{text}</span>
    </div>
  );
}
