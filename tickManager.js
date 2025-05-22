const FPS = 60;

function createTickManager() {
  const tasks = [];

  function tick() {
    tasks.forEach((task) => task());
    setTimeout(tick, 1000 / FPS);
  }

  setTimeout(tick, 1000 / FPS);

  return {
    addTask: (task) => {
      tasks.push(task);
      return () => {
        tasks.splice(tasks.indexOf(task), 1);
      };
    },
    removeTask: (task) => {
      tasks.splice(tasks.indexOf(task), 1);
    },
  };
}

module.exports = { createTickManager };
