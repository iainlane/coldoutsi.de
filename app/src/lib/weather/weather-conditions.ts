export const WeatherEmoji = {
  Clear: "☀️",
  ClearNight: "🌙",
  Cloudy: "☁️",
  Foggy: "🌫️",
  HeavyRain: "🌧️",
  HeavySnow: "🌨️️",
  LightRain: "🌦",
  LightRainNight: "🌧️",
  LightSnow: "🌨️",
  PartlyCloudy: "️🌤️",
  Rain: "🌧️",
  Snow: "️❄️",
  Sunny: "☀️",
  Thunderstorm: "️🌩️️",
  ThunderyShowers: "️⛈️",
  Tornado: "🌪️",
  Unknown: "✨",
} as const;

export interface WeatherCondition {
  main: string;
  description: string;
  art: {
    // This means that the emoji property can only be one of the values in
    // WeatherEmoji
    emoji: (typeof WeatherEmoji)[keyof typeof WeatherEmoji];
    html: string;
    ansi: string;
  };
}
