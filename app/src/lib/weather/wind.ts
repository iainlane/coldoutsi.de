import { toTwoDP } from "@/lib/util";

import { ansi, html, ThemeColours } from "./colours";
import { Units } from ".";

export enum WindDirection {
  S = "↓",
  SW = "↙️",
  W = "←",
  NW = "↖️",
  N = "↑",
  NE = "↗️",
  E = "→",
  SE = "↘️",
}

type NonNegativeNumber<T extends number> = number extends T
  ? never
  : `${T}` extends `-${string}`
    ? never
    : T;

type Degree<N extends number> = NonNegativeNumber<N>;

export function isDegree<N extends number>(n: N): n is Degree<N> {
  return n >= 0 && n <= 360;
}

export class InvalidWindDirectionError extends Error {
  constructor(direction: number) {
    super(`Invalid wind direction: ${direction}`);
  }
}

// Map a wind direction in degrees to a WindDirection enum value
export function getWindDirection<N extends number>(
  degrees: Degree<N>,
): keyof typeof WindDirection {
  if (degrees >= 337.5 || degrees < 22.5) {
    return "N";
  } else if (degrees >= 22.5 && degrees < 67.5) {
    return "NE";
  } else if (degrees >= 67.5 && degrees < 112.5) {
    return "E";
  } else if (degrees >= 112.5 && degrees < 157.5) {
    return "SE";
  } else if (degrees >= 157.5 && degrees < 202.5) {
    return "S";
  } else if (degrees >= 202.5 && degrees < 247.5) {
    return "SW";
  } else if (degrees >= 247.5 && degrees < 292.5) {
    return "W";
  } else if (degrees >= 292.5 && degrees < 337.5) {
    return "NW";
  } else {
    throw new InvalidWindDirectionError(degrees);
  }
}

enum BeaufortScaleTypes {
  Calm,
  LightAir,
  LightBreeze,
  GentleBreeze,
  ModerateBreeze,
  FreshBreeze,
  StrongBreeze,
  HighWind,
  Gale,
  StrongGale,
  Storm,
  ViolentStorm,
  Hurricane,
}

interface BeaufortScale {
  name: string;
  description: string;
  colour: ThemeColours;
}

const BeaufortScale: { [key in BeaufortScaleTypes]: BeaufortScale } = {
  [BeaufortScaleTypes.Calm]: {
    name: "Calm",
    description: "Smoke rises vertically",
    colour: "green",
  },
  [BeaufortScaleTypes.LightAir]: {
    name: "Light Air",
    description: "Wind direction shown by smoke but not by wind vanes",
    colour: "green",
  },
  [BeaufortScaleTypes.LightBreeze]: {
    name: "Light Breeze",
    description:
      "Wind felt on face; leaves rustle; ordinary vanes moved by wind",
    colour: "greenBright",
  },
  [BeaufortScaleTypes.GentleBreeze]: {
    name: "Gentle Breeze",
    description:
      "Leaves and small twigs in constant motion; light flags extended",
    colour: "greenBright",
  },
  [BeaufortScaleTypes.ModerateBreeze]: {
    name: "Moderate Breeze",
    description: "Raises dust and loose paper; small branches moved",
    colour: "yellow",
  },
  [BeaufortScaleTypes.FreshBreeze]: {
    name: "Fresh Breeze",
    description:
      "Small trees in leaf begin to sway; crested wavelets form on inland waters",
    colour: "yellowBright",
  },
  [BeaufortScaleTypes.StrongBreeze]: {
    name: "Strong Breeze",
    description:
      "Large branches in motion; whistling heard in telegraph wires; umbrellas used with difficulty",
    colour: "yellowBright",
  },
  [BeaufortScaleTypes.HighWind]: {
    name: "High Wind",
    description:
      "Whole trees in motion; inconvenience felt when walking against the wind",
    colour: "yellowBright",
  },
  [BeaufortScaleTypes.Gale]: {
    name: "Gale",
    description: "Twigs broken from trees; generally impedes progress",
    colour: "yellowBright",
  },
  [BeaufortScaleTypes.StrongGale]: {
    name: "Strong Gale",
    description:
      "Slight structural damage occurs (chimney pots and slates removed)",
    colour: "redBright",
  },
  [BeaufortScaleTypes.Storm]: {
    name: "Storm",
    description:
      "Seldom experienced inland; trees uprooted; considerable structural damage occurs",
    colour: "redBright",
  },
  [BeaufortScaleTypes.ViolentStorm]: {
    name: "Violent Storm",
    description: "Very rarely experienced; accompanied by widespread damage",
    colour: "redBright",
  },
  [BeaufortScaleTypes.Hurricane]: {
    name: "Hurricane",
    description: "Devastation occurs",
    colour: "red",
  },
};

interface UnitWindSpeedTypeMapping {
  metric: WindSpeedMetresPerSecond;
  imperial: WindSpeedMilesPerHour;
}

export type WindSpeedType<U extends Units> =
  U extends keyof UnitWindSpeedTypeMapping
    ? UnitWindSpeedTypeMapping[U]
    : never;

abstract class SingleWindSpeed {
  constructor(public readonly speed: number) {}

  protected abstract speedMPS(): number;

  get beaufort(): BeaufortScale {
    const speedMS = this.speedMPS();

    if (speedMS < 0.3) {
      return BeaufortScale[BeaufortScaleTypes.Calm];
    } else if (speedMS < 1.6) {
      return BeaufortScale[BeaufortScaleTypes.LightAir];
    } else if (speedMS < 3.4) {
      return BeaufortScale[BeaufortScaleTypes.LightBreeze];
    } else if (speedMS < 5.5) {
      return BeaufortScale[BeaufortScaleTypes.GentleBreeze];
    } else if (speedMS < 8) {
      return BeaufortScale[BeaufortScaleTypes.ModerateBreeze];
    } else if (speedMS < 10.8) {
      return BeaufortScale[BeaufortScaleTypes.FreshBreeze];
    } else if (speedMS < 13.9) {
      return BeaufortScale[BeaufortScaleTypes.StrongBreeze];
    } else if (speedMS < 17.2) {
      return BeaufortScale[BeaufortScaleTypes.HighWind];
    } else if (speedMS < 20.8) {
      return BeaufortScale[BeaufortScaleTypes.Gale];
    } else if (speedMS < 24.5) {
      return BeaufortScale[BeaufortScaleTypes.StrongGale];
    } else if (speedMS < 28.5) {
      return BeaufortScale[BeaufortScaleTypes.Storm];
    } else if (speedMS < 32.7) {
      return BeaufortScale[BeaufortScaleTypes.ViolentStorm];
    } else {
      return BeaufortScale[BeaufortScaleTypes.Hurricane];
    }
  }

  private get toTwoDP(): number {
    return toTwoDP(this.speed);
  }

  get ANSIString(): string {
    return ansi[this.beaufort.colour](this.toTwoDP.toString());
  }

  get HTMLString(): string {
    return html[this.beaufort.colour](this.toTwoDP.toString());
  }
}

class SingleWindSpeedMetresPerSecond extends SingleWindSpeed {
  speedMPS(): number {
    return this.speed;
  }
}

class SingleWindSpeedMilesPerHour extends SingleWindSpeed {
  speedMPS(): number {
    return this.speed / 2.23694;
  }
}

abstract class BaseWindSpeed {
  constructor(
    protected readonly swsSpeed: SingleWindSpeed,
    protected readonly swsGusts: SingleWindSpeed | undefined,
    public readonly direction: keyof typeof WindDirection,
  ) {}

  abstract unit: string;

  get speed(): number {
    return this.swsSpeed.speed;
  }

  get gusts(): number | undefined {
    return this.swsGusts?.speed;
  }

  toString(): string {
    const gusts =
      this.gusts === undefined || this.gusts === this.speed
        ? ""
        : `–${this.gusts}`;
    return `${this.speed}${gusts} ${this.unit} ${WindDirection[this.direction]}`;
  }

  get ANSIString(): string {
    const gusts =
      this.swsGusts === undefined || this.gusts === this.speed
        ? ""
        : `–${this.swsGusts.ANSIString}`;
    return `${this.swsSpeed.ANSIString}${gusts} ${this.unit} ${WindDirection[this.direction]}`;
  }

  get HTMLString(): string {
    const gusts =
      this.swsGusts === undefined || this.gusts === this.speed
        ? ""
        : `–${this.swsGusts.HTMLString}`;
    return `${this.swsSpeed.HTMLString}${gusts} ${this.unit} ${WindDirection[this.direction]}`;
  }

  toJSON(): {
    speed: SingleWindSpeed;
    gusts: SingleWindSpeed | undefined;
    unit: string;
    direction: string;
  } {
    return {
      speed: this.swsSpeed,
      gusts: this.swsGusts,
      unit: this.unit,
      direction: WindDirection[this.direction],
    };
  }
}

export class WindSpeedMetresPerSecond extends BaseWindSpeed {
  unit = "m/s";

  constructor(
    speed: number,
    gusts: number | undefined,
    direction: keyof typeof WindDirection,
  ) {
    const swsSpeed = new SingleWindSpeedMetresPerSecond(speed);
    const swsGusts = gusts
      ? new SingleWindSpeedMetresPerSecond(gusts)
      : undefined;

    super(swsSpeed, swsGusts, direction);
  }

  protected speedMPS(speed: number): number {
    return speed;
  }

  toMilesPerHour(): WindSpeedMilesPerHour {
    return new WindSpeedMilesPerHour(
      this.speed * 2.23694,
      this.gusts ? this.gusts * 2.23694 : undefined,
      this.direction,
    ); // 1 m/s = 2.23694 mph
  }

  static is(value: unknown): value is WindSpeedMetresPerSecond {
    return value instanceof WindSpeedMetresPerSecond;
  }
}

export class WindSpeedMilesPerHour extends BaseWindSpeed {
  unit = "mph";

  constructor(
    speed: number,
    gusts: number | undefined,
    direction: keyof typeof WindDirection,
  ) {
    const swsSpeed = new SingleWindSpeedMilesPerHour(speed);
    const swsGusts = gusts ? new SingleWindSpeedMilesPerHour(gusts) : undefined;

    super(swsSpeed, swsGusts, direction);
  }

  protected speedMPS(speed: number): number {
    return speed / 2.23694;
  }

  toMetersPerSecond(): WindSpeedMetresPerSecond {
    return new WindSpeedMetresPerSecond(
      this.speedMPS(this.speed),
      this.gusts ? this.speedMPS(this.gusts) : undefined,
      this.direction,
    );
  }

  static is(value: unknown): value is WindSpeedMilesPerHour {
    return value instanceof WindSpeedMilesPerHour;
  }
}
