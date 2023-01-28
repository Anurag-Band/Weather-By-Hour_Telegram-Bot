const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const weatherAPI = require('./api/weather');
const { TELEGRAM_API_TOKEN } = process.env;
const {
  ToadScheduler,
  SimpleIntervalJob,
  AsyncTask,
} = require('toad-scheduler');

const bot = new TelegramBot(TELEGRAM_API_TOKEN, { polling: true });

const scheduleTask = async (res, replyMsg, CITY_NAME) => {
  const task = new AsyncTask(
    `${replyMsg?.chat?.first_name}-${replyMsg?.chat?.id}`,
    async () => {
      const temperature = res.main.temp.toFixed(0);
      await bot.sendMessage(
        replyMsg.chat.id,
        `Temperature in ${CITY_NAME} is ${temperature}°C`
      );
    },
    (err) => {
      console.log({ 'error has occured': err });
    }
  );
  const job = new SimpleIntervalJob({ seconds: 10 }, task);

  return job;
};

bot.onText(/\/start/, async (message) => {
  const scheduler = new ToadScheduler();

  const isCityAvailable = async (message) => {
    await bot.sendMessage(
      message.chat.id,
      'Please Enter Your City Name, For Weather Information.'
    );

    bot.on('message', async (replyMsg) => {
      const CITY_NAME = replyMsg?.text;
      const res = await weatherAPI(CITY_NAME);

      if (res.cod != '200') {
        await bot.sendMessage(replyMsg?.chat.id, res?.message);
        return await isCityAvailable(replyMsg);
      }
      const job = await scheduleTask(res, replyMsg, CITY_NAME);
      scheduler.addSimpleIntervalJob(job);
    });
  };

  await isCityAvailable(message);
});

bot.on('polling_error', (error) => {
  console.log({ polling_error: error });
});
