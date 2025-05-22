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

function createBot({ sendMessage, leaveRoom }) {
  const botName = `${getRandomOf(FIRST_NAME)} ${getRandomOf(LAST_NAME)}`;
  const createdAt = Date.now();
  const lifeTime = Math.floor(Math.random() * 1000) + 1000;

  function onEnterRoom() {
    sendMessage(`Hello, I'm ${botName} and I will stay here for ${lifeTime}ms`);
  }

  function onBeforeLeaveRoom() {
    sendMessage(`Goodbye, I'm ${botName} and I'm leaving the room`);
  }

  return {
    name: botName,
    lifeTime,
    createdAt,
    onEnterRoom,
    onBeforeLeaveRoom,
    sendMessage,
  };
}

module.exports = { createBot };
