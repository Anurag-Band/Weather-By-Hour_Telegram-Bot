require('dotenv').config({
  path: '../../.env',
});
const { WEATHER_API_KEY } = process.env;
const axios = require('axios');

const weatherAPI = async (cityName) => {
  try {
    const BASE_URL = `https://api.openweathermap.org`;

    const { data } = await axios.get(
      `${BASE_URL}/data/2.5/weather?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`
    );
    return data;
  } catch (error) {
    console.log(`Axios Error: ${error}`);
  }
};

module.exports = weatherAPI;
