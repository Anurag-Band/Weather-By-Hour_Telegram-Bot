require('dotenv').config();
const express = require('express');
const expressApp = express();

const TelegramBot = require('node-telegram-bot-api');
const weatherAPI = require('./api/weather');
const { TELEGRAM_API_TOKEN, PUBLIC_URL } = process.env;
const {
  ToadScheduler,
  SimpleIntervalJob,
  AsyncTask,
} = require('toad-scheduler');
const NodeSchedule = require('node-schedule');
const PORT = process.env.PORT || 5001;

const bot = new TelegramBot(TELEGRAM_API_TOKEN);

// This informs the Telegram servers of the new webhook.
bot.setWebHook(`${PUBLIC_URL}/bot${TELEGRAM_API_TOKEN}`);

// parse the updates to JSON
expressApp.use(express.json());

// We are receiving updates at the route below!
expressApp.post(`/bot${TELEGRAM_API_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start Express Server
expressApp.listen(PORT, () => console.log(`Server Listenting on PORT:${PORT}`));

// For Clearing Job to Save Server Bandwidth
const clearJobs = (jobId, scheduler) => {
  const job = NodeSchedule.scheduleJob('5 * * *', async () => {
    scheduler.removeById(jobId);
    await bot.sendMessage(
      jobId,
      `Free Limit Exceeded!! - Contact Bot Owner for Further Access`
    );
    console.log(`Job is removed with id - ${jobId}`);
  });
};

// Code for Telegram Bot for Scheduling Weather updates
const scheduleTask = async (res, replyMsg, CITY_NAME, scheduler) => {
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

  const jobId = replyMsg?.chat?.id;

  const job = new SimpleIntervalJob(
    { hours: 1, runImmediately: true },
    task,
    {
      preventOverrun: true,
      id: jobId,
    }
  );

  clearJobs(jobId, scheduler);

  return job;
};

// Just to ping!
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
        await bot.sendMessage(
          replyMsg?.chat.id,
          'Please Re-enter your City name'
        );
        return;
      }
      const job = await scheduleTask(res, replyMsg, CITY_NAME, scheduler);
      scheduler.addSimpleIntervalJob(job);
    });
  };

  await isCityAvailable(message);
});

// For Webhook Error
bot.on('webhook_error', (error) => {
  console.log(error.code); // => 'EPARSE'
});

// Handling Uncaught Exception
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err?.message}`);
  console.log(`Stack: ${err?.stack}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
