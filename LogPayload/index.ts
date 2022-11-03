import { Action } from "../lib/Action";

class LogPayload extends Action {
    execute() {
        this.log("--- Event payload ---");
        this.log(this.serializeToString(this.payload));
        this.log("----------");
        this.log("Done");
    }
}

const action = new LogPayload();
action.run();