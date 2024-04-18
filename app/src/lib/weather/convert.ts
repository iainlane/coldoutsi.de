import {
  CurrentMeasurement,
  DailyMeasurement,
  DegreesCelsius,
  DegreesFahrenheit,
  HourlyMeasurement,
  Measurement,
} from ".";

export function convertMetricToImperialMeasurement(
  m: Measurement<"metric">,
): Measurement<"imperial"> {
  return {
    ...m,
    wind: m.wind.toMilesPerHour(),
  };
}

export function convertMetricCurrentToImperialMeasurement(
  m: CurrentMeasurement<"metric">,
): CurrentMeasurement<"imperial"> {
  return {
    ...m,
    ...convertMetricToImperialMeasurement(m),
    temp: m.temp.toDegreesFahrenheit(),
  };
}

export function mapDegreesCelsiusToDegreesFahrenheit<
  T extends { [key: string]: DegreesCelsius },
>(obj: T): { [key in keyof T]: DegreesFahrenheit } {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value.toDegreesFahrenheit(),
    ]),
  ) as { [key in keyof T]: DegreesFahrenheit };
}

export function convertMetricHourlyToImperialMeasurement(
  m: HourlyMeasurement<"metric">,
): HourlyMeasurement<"imperial"> {
  return {
    ...m,
    ...convertMetricToImperialMeasurement(m),
    temp: m.temp.toDegreesFahrenheit(),
  };
}

export function convertMetricDailyToImperialMeasurement(
  m: DailyMeasurement<"metric">,
): DailyMeasurement<"imperial"> {
  return {
    ...m,
    ...convertMetricToImperialMeasurement(m),
    temp: mapDegreesCelsiusToDegreesFahrenheit(m.temp),
  };
}
