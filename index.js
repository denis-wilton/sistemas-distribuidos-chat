const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
const { createTickManager } = require("./tickManager");
const { createBot } = require("./bot");

function createMessageManager() {
  const messages = [];
  let lastMessage = null;

  let subscribers = [];

  function addMessage(message) {
    messages.push(message);
    messages.length > 100 && messages.shift();
    lastMessage = message;
    console.log("message", message);
    subscribers.forEach((subscriber) =>
      subscriber({ type: "message", data: message })
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
  const bots = [];

  function addBot(bot) {
    bots.push(bot);
    bot.onEnterRoom();
  }

  function removeBot(bot) {
    bots.splice(bots.indexOf(bot), 1);
    bot.onBeforeLeaveRoom();
  }

  tickManager.addTask(() => {
    if (Math.random() < 0.95) {
      return;
    }

    if (Math.random() > 0.8) {
      const randomBotQuantity = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < randomBotQuantity; i++) {
        const bot = createBot({
          sendMessage: (message) => messageManager.addMessage(message),
          leaveRoom: () => removeBot(bot),
        });
        addBot(bot);
      }
    }
    bots.forEach((bot) => {
      if (Math.random() > 0.9) {
        bot.sendMessage(`Random message from ${bot.name}`);
      }
    });
    bots.forEach((bot) => {
      if (Date.now() - bot.createdAt > bot.lifeTime) {
        removeBot(bot);
      }
    });
  });

  return { addBot, removeBot };
}

const messageManager = createMessageManager();
const botsManager = createBotsManager(messageManager);

const clients = [];

const commands = {
  ping: () => {
    return "pong";
  },
  message: (data) => {
    messageManager.addMessage(data);
    return "message sent";
  },
};

wss.on("connection", (s) => {
  console.log("Client connected");
  clients.push(s);

  const unsubscribe = messageManager.subscribe(({ type, data }) => {
    clients.forEach((client) => {
      client.send(JSON.stringify({ type, data }));
    });
  });

  s.on("close", () => {
    clients.splice(clients.indexOf(s), 1);
    unsubscribe();
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
