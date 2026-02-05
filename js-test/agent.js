class Agent {
    constructor(name) {
        this.name = name;
        this.memory = [];
    }

    observe(world) {
        return world.events;
    }

    decide(world) {
        const action = {
            agent: this.name,
            action: "observe",
            time: world.time
        };

        this.memory.push(action);
        return action;
    }
}

module.exports = Agent;