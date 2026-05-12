import { useEffect, useState } from "react";
import { CloudSun, LocateFixed, Loader2, TriangleAlert } from "lucide-react";
import { getWeatherRisk } from "../services/weather";
import { WeatherRisk } from "../types";

export function WeatherRiskCard() {
  const [risk, setRisk] = useState<WeatherRisk | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function loadWeather() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nextRisk = await getWeatherRisk(position.coords.latitude, position.coords.longitude);
          setRisk(nextRisk);
          setStatus("idle");
        } catch {
          setStatus("error");
        }
      },
      () => setStatus("error"),
      { enableHighAccuracy: false, timeout: 12000 }
    );
  }

  useEffect(() => {
    loadWeather();
  }, []);

  const riskColor =
    risk?.riskLevel === "High"
      ? "text-red-700 bg-red-50 border-red-100"
      : risk?.riskLevel === "Medium"
        ? "text-amber-800 bg-amber-50 border-amber-100"
        : "text-leaf-800 bg-leaf-50 border-leaf-100";

  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-3xl border border-leaf-100 bg-leaf-50 p-5 shadow-soft lg:grid-cols-[0.8fr_1.2fr] lg:p-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-leaf-700">
                <CloudSun className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Local Weather Risk</p>
                <h2 className="text-2xl font-black text-leaf-900">Field conditions today</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-green-950/68">
              Uses free Open-Meteo weather data to estimate whether humidity, rain, heat, or wind may increase disease risk.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5">
            {status === "loading" && (
              <div className="flex items-center gap-3 font-bold text-leaf-900">
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking local weather...
              </div>
            )}
            {status === "error" && (
              <div>
                <div className="flex items-center gap-3 font-bold text-amber-900">
                  <TriangleAlert className="h-5 w-5" />
                  Allow location to show weather risk.
                </div>
                <button onClick={loadWeather} className="mt-4 inline-flex items-center gap-2 rounded-full bg-leaf-600 px-4 py-2 text-sm font-black text-white">
                  <LocateFixed className="h-4 w-4" />
                  Try again
                </button>
              </div>
            )}
            {risk && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`rounded-full border px-4 py-2 text-sm font-black ${riskColor}`}>
                    {risk.riskLevel} risk
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-green-950/70">
                    <Metric label="Temp" value={`${Math.round(risk.temperature)}C`} />
                    <Metric label="Humidity" value={`${risk.humidity}%`} />
                    <Metric label="Rain" value={`${risk.rain}mm`} />
                    <Metric label="Wind" value={`${Math.round(risk.windSpeed)}km/h`} />
                  </div>
                </div>
                <p className="mt-4 font-semibold leading-7 text-green-950/78">{risk.summary}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {risk.tips.map((tip) => (
                    <div key={tip} className="rounded-2xl bg-leaf-50 px-3 py-3 text-sm font-semibold leading-6 text-green-950/70">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-leaf-50 px-3 py-2">
      <p className="text-leaf-900">{value}</p>
      <p className="mt-1 text-[0.68rem] uppercase tracking-wide text-green-950/50">{label}</p>
    </div>
  );
}
