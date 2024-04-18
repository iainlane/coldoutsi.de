import { artTemplates, WeatherCondition, WeatherEmoji } from "@/lib/weather";

type WeatherCode = number;

export const WeatherConditions: { [key: WeatherCode]: WeatherCondition } = {
  // Group 2xx: Thunderstorm
  200: {
    main: "Thunderstorm",
    description: "thunderstorm with light rain",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyShowers,
    },
  },
  201: {
    main: "Thunderstorm",
    description: "thunderstorm with rain",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyHeavyRain,
    },
  },
  202: {
    main: "Thunderstorm",
    description: "thunderstorm with heavy rain",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyHeavyRain,
    },
  },
  210: {
    main: "Thunderstorm",
    description: "light thunderstorm",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyShowers,
    },
  },
  211: {
    main: "Thunderstorm",
    description: "thunderstorm",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyShowers,
    },
  },
  212: {
    main: "Thunderstorm",
    description: "heavy thunderstorm",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyHeavyRain,
    },
  },
  221: {
    main: "Thunderstorm",
    description: "ragged thunderstorm",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyShowers,
    },
  },
  230: {
    main: "Thunderstorm",
    description: "thunderstorm with light drizzle",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyShowers,
    },
  },
  231: {
    main: "Thunderstorm",
    description: "thunderstorm with drizzle",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyShowers,
    },
  },
  232: {
    main: "Thunderstorm",
    description: "thunderstorm with heavy drizzle",
    art: {
      emoji: WeatherEmoji.Thunderstorm,
      ...artTemplates.iconThunderyHeavyRain,
    },
  },
  // Group 3xx: Drizzle
  300: {
    main: "Drizzle",
    description: "light intensity drizzle",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightShowers,
    },
  },
  301: {
    main: "Drizzle",
    description: "drizzle",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightShowers,
    },
  },
  302: {
    main: "Drizzle",
    description: "heavy intensity drizzle",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  310: {
    main: "Drizzle",
    description: "light intensity drizzle rain",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightShowers,
    },
  },
  311: {
    main: "Drizzle",
    description: "drizzle rain",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightShowers,
    },
  },
  312: {
    main: "Drizzle",
    description: "heavy intensity drizzle rain",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  313: {
    main: "Drizzle",
    description: "shower rain and drizzle",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  314: {
    main: "Drizzle",
    description: "heavy shower rain and drizzle",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  321: {
    main: "Drizzle",
    description: "shower drizzle",
    art: {
      emoji: WeatherEmoji.LightRain,
      ...artTemplates.iconLightShowers,
    },
  },
  // Group 5xx: Rain
  500: {
    main: "Rain",
    description: "light rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconLightRain,
    },
  },
  501: {
    main: "Rain",
    description: "moderate rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconLightRain,
    },
  },
  502: {
    main: "Rain",
    description: "heavy intensity rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyRain,
    },
  },
  503: {
    main: "Rain",
    description: "very heavy rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyRain,
    },
  },
  504: {
    main: "Rain",
    description: "extreme rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyRain,
    },
  },
  511: {
    main: "Rain",
    description: "freezing rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyRain,
    },
  },
  520: {
    main: "Rain",
    description: "light intensity shower rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconLightShowers,
    },
  },
  521: {
    main: "Rain",
    description: "shower rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  522: {
    main: "Rain",
    description: "heavy intensity shower rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  531: {
    main: "Rain",
    description: "ragged shower rain",
    art: {
      emoji: WeatherEmoji.Rain,
      ...artTemplates.iconHeavyShowers,
    },
  },
  // Group 6xx: Snow
  600: {
    main: "Snow",
    description: "light snow",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSnow,
    },
  },
  601: {
    main: "Snow",
    description: "snow",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnow,
    },
  },
  602: {
    main: "Snow",
    description: "heavy snow",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnow,
    },
  },
  611: {
    main: "Snow",
    description: "sleet",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconLightSleet,
    },
  },
  612: {
    main: "Snow",
    description: "light shower sleet",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSleetShowers,
    },
  },
  613: {
    main: "Snow",
    description: "shower sleet",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  615: {
    main: "Snow",
    description: "light rain and snow",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSleetShowers,
    },
  },
  616: {
    main: "Snow",
    description: "rain and snow",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconLightSleet,
    },
  },
  620: {
    main: "Snow",
    description: "light shower snow",
    art: {
      emoji: WeatherEmoji.LightSnow,
      ...artTemplates.iconLightSnowShowers,
    },
  },
  621: {
    main: "Snow",
    description: "shower snow",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  622: {
    main: "Snow",
    description: "heavy shower snow",
    art: {
      emoji: WeatherEmoji.Snow,
      ...artTemplates.iconHeavySnowShowers,
    },
  },
  // Group 7xx: Atmosphere
  701: {
    main: "Mist",
    description: "mist",
    art: {
      emoji: WeatherEmoji.Foggy,
      ...artTemplates.iconFog,
    },
  },
  711: {
    main: "Smoke",
    description: "smoke",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconFog,
    },
  },
  721: {
    main: "Haze",
    description: "haze",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconFog,
    },
  },
  731: {
    main: "Dust",
    description: "sand/dust whirls",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconUnknown,
    },
  },
  741: {
    main: "Fog",
    description: "fog",
    art: {
      emoji: WeatherEmoji.Foggy,
      ...artTemplates.iconFog,
    },
  },
  751: {
    main: "Sand",
    description: "sand",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconUnknown,
    },
  },
  761: {
    main: "Dust",
    description: "dust",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconUnknown,
    },
  },
  762: {
    main: "Ash",
    description: "volcanic ash",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconUnknown,
    },
  },
  771: {
    main: "Squall",
    description: "squalls",
    art: {
      emoji: WeatherEmoji.Unknown,
      ...artTemplates.iconUnknown,
    },
  },
  781: {
    main: "Tornado",
    description: "tornado",
    art: {
      emoji: WeatherEmoji.Tornado,
      ...artTemplates.iconUnknown,
    },
  },
  // Group 800: Clear
  800: {
    main: "Clear",
    description: "clear sky",
    art: {
      emoji: WeatherEmoji.Clear,
      ...artTemplates.iconSunny,
    },
  },
  // Group 80x: Clouds
  801: {
    main: "Clouds",
    description: "few clouds: 11-25%",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconPartlyCloudy,
    },
  },
  802: {
    main: "Clouds",
    description: "scattered clouds: 25-50%",
    art: {
      emoji: WeatherEmoji.PartlyCloudy,
      ...artTemplates.iconCloudy,
    },
  },
  803: {
    main: "Clouds",
    description: "broken clouds: 51-84%",
    art: {
      emoji: WeatherEmoji.Cloudy,
      ...artTemplates.iconVeryCloudy,
    },
  },
  804: {
    main: "Clouds",
    description: "overcast clouds: 85-100%",
    art: {
      emoji: WeatherEmoji.Cloudy,
      ...artTemplates.iconVeryCloudy,
    },
  },
};
