import { Inngest } from "inngest";

// Process name is the label for our app in the Inngest UI
export const inngest = new Inngest({
    id: "ooo-agent",
    eventKey: 'dummy-local-key' // Hardcode for E2E since the environment is misbehaving
});
