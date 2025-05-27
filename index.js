const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
const { createTickManager } = require("./tickManager");
const { createBot } = require("./bot");

const randomMessages = [
  "Hello, my name is {{name}}",
  "I'm {{name}}",
  "Olá, meu nome é {{name}}",
  "Oi pessoal, tudo bem?",
  "Como vocês estão?",
  "Estou bem, obrigado!",
  "Estou cansado",
  "Estou feliz",
  "Estou triste",
  "Estou animado",
  "Estou bravo",
  "Estou chateado",
  "Putz, perdi dinheiro denovo! Vou parar de comprar PETR4!",
  "PETR4 ta indo para 100 reais!",
  "VALE3 ta indo para 100 reais!",
  "BBDC4 ta indo para 100 reais!",
  "ITUB4 ta indo para 100 reais!",
  "PETR4 ta indo para 100 reais!",
  "Bora bora bora bora!",
  "Aeeeeee",
  "kkkkkkkkkkkkkkkkkkkkkkkk",
  "shuahsuahushaushuahu",
  "Vai Corinthians!",
  "Vai São Paulo!",
  "Vai Palmeiras!",
  "Pessoal, to vendendo uma geladeira, quem quer comprar?",
  "Esses dias eu vi um maluco aqui querendo vender uma geladeira, mas eu não queria, então eu falei para ele ir se fuder",
  "Tô com fome, alguém tem comida?",
  "Faz o pix ai irmão",
  "Se liga, isso aqui é um assalto!",
];

function createMessageManager() {
  const messages = [];
  let lastMessage = null;

  let subscribers = [];

  function addMessage(message, type, name) {
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
  const bots = [];
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
    bot.onEnterRoom();
    subscribers.forEach((subscriber) =>
      subscriber({ type: "enterRoom", data: { bot } })
    );
  }

  function removeBot(bot) {
    bots.splice(bots.indexOf(bot), 1);
    bot.onBeforeLeaveRoom();
    subscribers.forEach((subscriber) =>
      subscriber({ type: "leaveRoom", data: { bot } })
    );
  }

  tickManager.addTask(() => {
    if (Math.random() < 0.95) {
      return;
    }

    if (Math.random() > 0.8) {
      const randomBotQuantity = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < randomBotQuantity; i++) {
        const bot = createBot({
          sendMessage: (message, type, name) =>
            messageManager.addMessage(message, type, name),
          leaveRoom: () => removeBot(bot),
        });
        addBot(bot);
      }
    }
    bots.forEach((bot) => {
      if (Math.random() > 0.95) {
        bot.sendMessage(
          randomMessages[
            Math.floor(Math.random() * randomMessages.length)
          ].replace("{{name}}", bot.name),
          "user"
        );
      }
    });
    bots.forEach((bot) => {
      if (Date.now() - bot.createdAt > bot.lifeTime) {
        removeBot(bot);
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
