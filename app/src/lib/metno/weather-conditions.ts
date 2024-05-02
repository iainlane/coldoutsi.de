import { WeatherSymbol } from "@internal/met.no";

import { artTemplates, WeatherCondition, WeatherEmoji } from "@/lib/weather";

export const WeatherConditions: { [key in WeatherSymbol]: WeatherCondition } = {
  clearsky_day: {
    main: "Clear",
    description: "Clear sky",
    art: {
      emoji: WeatherEmoji.Clear,
      ...artTemplates.iconSunny,
    },
  },
  clearsky_night: {
    main: "Clear",
    description: "Clear sky",
    art: {
      emoji: WeatherEmoji.ClearNight,
      ...artTemplates.iconMoon,
    },
  },
  clearsky_polartwilight: {
    main: "Clear",
    description: "Clear sky",
    art: {
      emoji: WeatherEmoji.ClearNight,
      ...artTemplates.iconMoon,
    },
  },
  cloudy: {
    main: "Clouds",
    description: "Cloudy",
    art: {
      emoji: WeatherEmoji.Cloudy,
      ...artTemplates.iconCloudy,
    },
  },
  fair_day: {
    main: "Clouds",
    description: "Fair",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  fair_night: {
    main: "Clouds",
    description: "Fair",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  fair_polartwilight: {
    main: "Clouds",
    description: "Fair",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  fog: {
    main: "Fog",
    description: "Fog",
    art: {
      emoji: WeatherEmoji.Foggy,
      ...artTemplates.iconFog,
    },
  },
  heavysleet: {
    main: "Sleet",
    description: "Heavy sleet",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnow,
    },
  },
  heavysleetandthunder: {
    main: "Sleet",
    description: "Heavy sleet and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysleetshowers_day: {
    main: "Sleet",
    description: "Heavy sleet showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  heavysleetshowers_night: {
    main: "Sleet",
    description: "Heavy sleet showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  heavysleetshowers_polartwilight: {
    main: "Sleet",
    description: "Heavy sleet showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  heavysleetshowersandthunder_day: {
    main: "Sleet",
    description: "Heavy sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysleetshowersandthunder_night: {
    main: "Sleet",
    description: "Heavy sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysleetshowersandthunder_polartwilight: {
    main: "Sleet",
    description: "Heavy sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysnow: {
    main: "Snow",
    description: "Heavy snow",
    art: {
      emoji: WeatherEmoji.HeavySnow,
      ...artTemplates.iconHeavySnow,
    },
  },
  heavysnowandthunder: {
    main: "Snow",
    description: "Heavy snow and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysnowshowers_day: {
    main: "Snow",
    description: "Heavy snow showers",
    art: {
      emoji: WeatherEmoji.HeavySnow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  heavysnowshowers_night: {
    main: "Snow",
    description: "Heavy snow showers",
    art: {
      emoji: WeatherEmoji.HeavySnow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  heavysnowshowers_polartwilight: {
    main: "Snow",
    description: "Heavy snow showers",
    art: {
      emoji: WeatherEmoji.HeavySnow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  heavysnowshowersandthunder_day: {
    main: "Snow",
    description: "Heavy snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysnowshowersandthunder_night: {
    main: "Snow",
    description: "Heavy snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavysnowshowersandthunder_polartwilight: {
    main: "Snow",
    description: "Heavy snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavyrain: {
    main: "Rain",
    description: "Heavy rain",
    art: {
      emoji: WeatherEmoji.HeavyRain,
      ...artTemplates.iconHeavyRain,
    },
  },
  heavyrainandthunder: {
    main: "Rain",
    description: "Heavy rain and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavyrainshowers_day: {
    main: "Rain",
    description: "Heavy rain showers",
    art: {
      emoji: WeatherEmoji.HeavyRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  heavyrainshowers_night: {
    main: "Rain",
    description: "Heavy rain showers",
    art: {
      emoji: WeatherEmoji.HeavyRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  heavyrainshowers_polartwilight: {
    main: "Rain",
    description: "Heavy rain showers",
    art: {
      emoji: WeatherEmoji.HeavyRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  heavyrainshowersandthunder_day: {
    main: "Rain",
    description: "Heavy rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavyrainshowersandthunder_night: {
    main: "Rain",
    description: "Heavy rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  heavyrainshowersandthunder_polartwilight: {
    main: "Rain",
    description: "Heavy rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightrain: {
    main: "Rain",
    description: "Light rain",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightRain,
    },
  },
  lightrainandthunder: {
    main: "Rain",
    description: "Light rain and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightrainshowers_day: {
    main: "Rain",
    description: "Light rain showers",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightShowers,
    },
  },
  lightrainshowers_night: {
    main: "Rain",
    description: "Light rain showers",
    art: {
      emoji: WeatherEmoji.LightRainNight,
      ...artTemplates.iconLightShowers,
    },
  },
  lightrainshowers_polartwilight: {
    main: "Rain",
    description: "Light rain showers",
    art: {
      emoji: WeatherEmoji.LightRainNight,
      ...artTemplates.iconLightShowers,
    },
  },
  lightrainshowersandthunder_day: {
    main: "Rain",
    description: "Light rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightrainshowersandthunder_night: {
    main: "Rain",
    description: "Light rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightrainshowersandthunder_polartwilight: {
    main: "Rain",
    description: "Light rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightsleet: {
    main: "Sleet",
    description: "Light sleet",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSleet,
    },
  },
  lightsleetandthunder: {
    main: "Sleet",
    description: "Light sleet and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightsleetshowers_day: {
    main: "Sleet",
    description: "Light sleet showers",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSleetShowers,
    },
  },
  lightsleetshowers_night: {
    main: "Sleet",
    description: "Light sleet showers",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSleetShowers,
    },
  },
  lightsleetshowers_polartwilight: {
    main: "Sleet",
    description: "Light sleet showers",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSleetShowers,
    },
  },
  lightsnow: {
    main: "Snow",
    description: "Light snow",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSnow,
    },
  },
  lightsnowandthunder: {
    main: "Snow",
    description: "Light snow and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightsnowshowers_day: {
    main: "Snow",
    description: "Light snow showers",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSnowShowers,
    },
  },
  lightsnowshowers_night: {
    main: "Snow",
    description: "Light snow showers",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSnowShowers,
    },
  },
  lightsnowshowers_polartwilight: {
    main: "Snow",
    description: "Light snow showers",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSnowShowers,
    },
  },
  lightssleetshowersandthunder_day: {
    main: "Sleet",
    description: "Light sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightssleetshowersandthunder_night: {
    main: "Sleet",
    description: "Light sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightssleetshowersandthunder_polartwilight: {
    main: "Sleet",
    description: "Light sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightssnowshowersandthunder_day: {
    main: "Snow",
    description: "Light snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightssnowshowersandthunder_night: {
    main: "Snow",
    description: "Light snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  lightssnowshowersandthunder_polartwilight: {
    main: "Snow",
    description: "Light snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  partlycloudy_day: {
    main: "Clouds",
    description: "Partly cloudy",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  partlycloudy_night: {
    main: "Clouds",
    description: "Partly cloudy",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  partlycloudy_polartwilight: {
    main: "Clouds",
    description: "Partly cloudy",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  rain: {
    main: "Rain",
    description: "Rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyRain,
    },
  },
  rainandthunder: {
    main: "Rain",
    description: "Rain and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  rainshowers_day: {
    main: "Rain",
    description: "Rain showers",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  rainshowers_night: {
    main: "Rain",
    description: "Rain showers",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  rainshowers_polartwilight: {
    main: "Rain",
    description: "Rain showers",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  rainshowersandthunder_day: {
    main: "Rain",
    description: "Rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  rainshowersandthunder_night: {
    main: "Rain",
    description: "Rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  rainshowersandthunder_polartwilight: {
    main: "Rain",
    description: "Rain showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  sleet: {
    main: "Sleet",
    description: "Sleet",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconLightSleet,
    },
  },
  sleetandthunder: {
    main: "Sleet",
    description: "Sleet and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  sleetshowers_day: {
    main: "Sleet",
    description: "Sleet showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  sleetshowers_night: {
    main: "Sleet",
    description: "Sleet showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  sleetshowers_polartwilight: {
    main: "Sleet",
    description: "Sleet showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  sleetshowersandthunder_day: {
    main: "Sleet",
    description: "Sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  sleetshowersandthunder_night: {
    main: "Sleet",
    description: "Sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  sleetshowersandthunder_polartwilight: {
    main: "Sleet",
    description: "Sleet showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  snow: {
    main: "Snow",
    description: "Snow",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnow,
    },
  },
  snowandthunder: {
    main: "Snow",
    description: "Snow and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  snowshowers_day: {
    main: "Snow",
    description: "Snow showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  snowshowers_night: {
    main: "Snow",
    description: "Snow showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  snowshowers_polartwilight: {
    main: "Snow",
    description: "Snow showers",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  snowshowersandthunder_day: {
    main: "Snow",
    description: "Snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  snowshowersandthunder_night: {
    main: "Snow",
    description: "Snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
  snowshowersandthunder_polartwilight: {
    main: "Snow",
    description: "Snow showers and thunder",
    art: {
      emoji: WeatherEmoji.ThunderyShowers,
      ...artTemplates.iconThunderyShowers,
    },
  },
};
