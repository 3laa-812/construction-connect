import axios from 'axios';

export async function fetchWeather(lat: number, lon: number) {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('Weather API key missing, returning null weather context.');
    return null;
  }
  try {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      description: data.weather[0].description,
    };
  } catch (err) {
    console.error('Failed to fetch weather', err);
    return null;
  }
}
