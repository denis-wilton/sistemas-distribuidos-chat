const WebSocket = require("ws");
const fs = require("fs");
const wss = new WebSocket.Server({ port: 8080 });
const { createTickManager } = require("./tickManager");
const { createBot } = require("./bot");

const randomMessages = fs.readFileSync("./messages.txt", "utf8").split("\n");
const MAX_BOTS = 150;

function createMessageManager() {
  const messages = [];
  let lastMessage = null;

  let subscribers = [];

  function addMessage(message, type, name) {
    let color;

    if (type === "system") {
      color = "\x1b[90m"; // cinza
    } else if (type === "user") {
      color = "\x1b[34m"; // azul
    } else {
      color = "\x1b[31m"; // vermelho (padrão para outros tipos)
    }

    console.log("addMessage", type, name, `${color}${message}\x1b[0m`);
    messages.push({ message, type, name });
    messages.length > 100 && messages.shift();
    lastMessage = message;
    subscribers.forEach((subscriber) =>
      subscriber({ type: "message", data: { message, type, name } })
    );
  }

  function getAllMessages() {
    return messages;
  }

  function getLastMessage() {
    return lastMessage;
  }

  function subscribe(subscriber) {
    subscribers.push(subscriber);
    return () => unsubscribe(subscriber);
  }

  function unsubscribe(subscriber) {
    subscribers = subscribers.filter((s) => s !== subscriber);
  }

  return { addMessage, getAllMessages, getLastMessage, subscribe, unsubscribe };
}

function createBotsManager(messageManager) {
  const tickManager = createTickManager();
  const bots = Array.from({ length: MAX_BOTS }, () => {
    const bot = createBot({
      leaveRoom: () => removeBot(bot),
      sendMessage: (message, type) =>
        messageManager.addMessage(message, type, bot.name),
    });
    return bot;
  });
  let subscribers = [];

  function subscribe(subscriber) {
    subscribers.push(subscriber);
    return () => unsubscribe(subscriber);
  }

  function unsubscribe(subscriber) {
    subscribers = subscribers.filter((s) => s !== subscriber);
  }

  function addBot(bot) {
    bots.push(bot);
    console.log(bots.length);
    bot.onEnterRoom();
    subscribers.forEach((subscriber) =>
      subscriber({ type: "enterRoom", data: { bot } })
    );
  }

  function removeBot(bot) {
    bots.splice(bots.indexOf(bot), 1);
    console.log(bots.length);
    bot.onBeforeLeaveRoom();
    subscribers.forEach((subscriber) =>
      subscriber({ type: "leaveRoom", data: { bot } })
    );
  }

  tickManager.addTask(() => {
    if (bots.length < MAX_BOTS && Math.random() > 0.9) {
      const bot = createBot({
        leaveRoom: () => removeBot(bot),
        sendMessage: (message, type) =>
          messageManager.addMessage(message, type, bot.name),
      });
      addBot(bot);
    }

    bots.forEach((bot) => {
      const shouldExit = bot.lifeTime - (Date.now() - bot.createdAt) < 0;
      if (shouldExit) {
        removeBot(bot);
        return;
      }

      if (Math.random() > 0.999) {
        bot.sendMessage(
          randomMessages[
            Math.floor(Math.random() * randomMessages.length)
          ].replace("{{name}}", bot.name),
          "user"
        );
      }
    });
  });

  return { addBot, removeBot, subscribe, allBots: bots };
}

const messageManager = createMessageManager();
const botsManager = createBotsManager(messageManager);

const clients = [];

const commands = {
  ping: () => {
    return "pong";
  },
  message: (data) => {
    messageManager.addMessage(data.message, data.type, data.name);
    return "message sent";
  },
};

wss.on("connection", (s) => {
  console.log("Client connected");
  clients.push(s);

  const unsubscribe = messageManager.subscribe(({ type, data }) => {
    s.send(JSON.stringify({ type, data }));
  });

  const unsubscribeBots = botsManager.subscribe(({ type, data }) => {
    s.send(JSON.stringify({ type, data }));
  });

  s.send(
    JSON.stringify({
      type: "listRoom",
      data: botsManager.allBots.map((bot) => ({ name: bot.name })),
    })
  );

  s.on("close", () => {
    clients.splice(clients.indexOf(s), 1);
    unsubscribe();
    unsubscribeBots();
  });

  s.on("message", (message) => {
    const command = JSON.parse(message);
    const response = commands[command.type](command.data);
    s.send(JSON.stringify(response));
  });

  s.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  s.on("open", () => {
    console.log("Client connected");
  });
});

console.log("WebSocket server running on port 8080");
