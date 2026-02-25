import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
    startContextIndexing,
    pollIncomingEmails,
    processNewEmails,
    setupGmailWatch,
    stopGmailWatch
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        startContextIndexing,
        pollIncomingEmails,
        processNewEmails,
        setupGmailWatch,
        stopGmailWatch
    ],
});
