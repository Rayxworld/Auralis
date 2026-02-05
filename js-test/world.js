class World{
    constructor(){
        this.time = 0;
        this.agents = [];
        this.events = [];

    }
    registerAgent(agent) {
        this.agents.push(agent);
    }

    step() {
        this.time += 1;

        for (const agent of this.agents) {
            const action = agent.decide(this);
            this.resolve(action);
        }
    }

    resolve(action) {
        this.events.push(action);
    }
}

module.exports = World;