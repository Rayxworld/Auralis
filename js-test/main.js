const World = require("./world");
const Agent = require("./agent");

const world = new World();

const agent1 = new Agent("Auralis-1");
const agent2 = new Agent("Auralis-2");

world.registerAgent(agent1);
world.registerAgent(agent2);

for (let i =0; i  < 5; i++){
    world.step();
}

console.log("World Events")
console.log(world.events)