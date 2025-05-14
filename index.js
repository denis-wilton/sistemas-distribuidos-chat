const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

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

function createBot(params) {
  const botName = `bot-${Math.random().toString(36).substring(2, 15)}`;
  const createdAt = Date.now();
  const lifeTime = Math.floor(Math.random() * 1000) + 1000;

  function sendMessage(message) {
    params.sendMessage(message);
  }

  function readMessage(message) {
    if (message.includes(botName)) {
      sendMessage(`Oh, are you talking to me? Sorry, I'm busy right now.`);
    }
  }

  function onEnterRoom() {
    sendMessage(`Hello, I'm ${botName} and I will stay here for ${lifeTime}ms`);
  }

  function onLeaveRoom() {
    sendMessage(`Goodbye, I'm ${botName} and I'm leaving the room`);
  }

  return {
    name: botName,
    lifeTime,
    createdAt,
    onEnterRoom,
    readMessage,
    onLeaveRoom,
    sendMessage,
  };
}

function createBotsManager(messageManager) {
  const bots = [];

  function addBot(bot) {
    bots.push(bot);
    bot.onEnterRoom();
  }

  function removeBot(bot) {
    bots.splice(bots.indexOf(bot), 1);
    bot.onLeaveRoom();
  }

  function tick() {
    if (Math.random() > 0.8) {
      const randomBotQuantity = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < randomBotQuantity; i++) {
        addBot(
          createBot({
            sendMessage: (message) => messageManager.addMessage(message),
          })
        );
      }
    }

    bots.forEach((bot) => {
      if (Math.random() > 0.9) {
        let message = `Random message from ${bot.name}`;
        const shouldTalkToAnotherBot = Math.random() > 0.5;
        if (shouldTalkToAnotherBot) {
          const anotherBot = bots[Math.floor(Math.random() * bots.length)];
          message = `Random message from ${bot.name} to ${anotherBot.name}`;
        }
        bot.sendMessage(message);
      }
    });

    bots.forEach((bot) => {
      if (Date.now() - bot.createdAt > bot.lifeTime) {
        removeBot(bot);
      }
    });

    setTimeout(tick, Math.floor(Math.random() * 1000) + 100);
  }

  setTimeout(() => {
    tick();
  }, 50);

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
