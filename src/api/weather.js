require('dotenv').config({
  path: '../../.env',
});
const { WEATHER_API_KEY } = process.env;

const weatherAPI = (cityName) => {
  const BASE_URL = `https://api.openweathermap.org`;

  const data = fetch(
    `${BASE_URL}/data/2.5/weather?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`
  ).then((res) => res.json());

  return data;
};

module.exports = weatherAPI;
