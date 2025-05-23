const FIRST_NAME = [
  "Sérgio",
  "João",
  "Maria",
  "José",
  "Ana",
  "Pedro",
  "Paula",
  "Carlos",
  "Lucas",
  "Marcelo",
  "Fernanda",
  "Gabriel",
  "Isabela",
  "Matheus",
  "Laura",
  "Samuel",
  "Rafael",
  "Camila",
  "Bruno",
  "Carla",
  "Diego",
  "Eduarda",
  "Felipe",
  "Gustavo",
  "Helena",
  "Igor",
  "Julia",
  "Kauã",
  "Larissa",
  "Miguel",
  "Nathalia",
  "Otávio",
  "Patrícia",
  "Quentinho",
  "Rafaela",
];

const LAST_NAME = [
  "Silva",
  "Santos",
  "Oliveira",
  "Pereira",
  "Costa",
  "Rodrigues",
  "Alves",
  "Ferreira",
  "Gomes",
  "Lima",
  "Martins",
  "Nunes",
  "Oliveira",
  "Pereira",
  "Ribeiro",
  "Silva",
  "Santos",
  "Silva",
  "Souza",
  "Tavares",
  "Vieira",
  "Xavier",
  "Yamada",
  "Zanetti",
];

function getRandomOf(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const FIFTEEN_SECONDS = 15 * 1000;
const TWO_MINUTES = 2 * 60 * 1000;
function createBot({ sendMessage, leaveRoom }) {
  const botName = `${getRandomOf(FIRST_NAME)} ${getRandomOf(LAST_NAME)}`;
  const createdAt = Date.now();
  const lifeTime =
    Math.floor(Math.random() * (TWO_MINUTES - FIFTEEN_SECONDS)) +
    FIFTEEN_SECONDS;

  function onEnterRoom() {
    sendMessage(`${botName} has entered the room`, "system", botName);
  }

  function onBeforeLeaveRoom() {
    sendMessage(`${botName} is leaving the room`, "system", botName);
  }

  return {
    name: botName,
    lifeTime,
    createdAt,
    onEnterRoom,
    onBeforeLeaveRoom,
    sendMessage: (message, type) => sendMessage(message, type, botName),
  };
}

module.exports = { createBot };
