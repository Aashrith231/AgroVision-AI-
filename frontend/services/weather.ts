import { WeatherRisk } from "../types";

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    rain: number;
    wind_speed_10m: number;
  };
};

export async function getWeatherRisk(latitude: number, longitude: number): Promise<WeatherRisk> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,rain,wind_speed_10m",
    timezone: "auto"
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error("Weather lookup failed");
  const data = (await response.json()) as OpenMeteoResponse;
  const temperature = data.current.temperature_2m;
  const humidity = data.current.relative_humidity_2m;
  const rain = data.current.rain;
  const windSpeed = data.current.wind_speed_10m;

  let score = 0;
  const tips: string[] = [];
  if (humidity >= 80) {
    score += 2;
    tips.push("High humidity can increase fungal disease spread.");
  }
  if (rain > 0) {
    score += 2;
    tips.push("Rain is present, so avoid spraying until leaves are dry.");
  }
  if (temperature >= 30 && humidity >= 65) {
    score += 1;
    tips.push("Warm and humid weather can favor leaf infections.");
  }
  if (windSpeed >= 18) {
    score += 1;
    tips.push("Wind is high, avoid spraying to reduce drift.");
  }
  if (tips.length === 0) tips.push("Weather is not strongly favoring disease spread right now.");

  const riskLevel = score >= 4 ? "High" : score >= 2 ? "Medium" : "Low";
  return {
    temperature,
    humidity,
    rain,
    windSpeed,
    riskLevel,
    summary:
      riskLevel === "High"
        ? "Weather conditions may help disease spread. Inspect the crop closely."
        : riskLevel === "Medium"
          ? "Some weather factors may increase disease risk. Keep monitoring."
          : "Current weather risk looks low, but continue regular checks.",
    tips
  };
}
