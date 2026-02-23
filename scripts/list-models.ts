const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // Load .env manually if needed, though run context might handle it

async function main() {
    console.log("Listing models...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("No API KEY");
        return;
    }

    // Since the SDK doesn't expose listModels easily on the client instance directly in all versions,
    // we might need to fallback to REST or check if there is a method.
    // Actually, checking docs: the SDK *doesn't* have a listModels method exposed on the main class easily in v0.1.
    // BUT we can try to guess.

    // However, since generation WORKED for gemini-1.5-flash, we know auth is good.

    // Let's try to hit the REST API directly to list models to see what we have access to.
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Response Status:", response.status);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                if (m.name.includes("embed")) {
                    console.log(` - ${m.name} (Supported methods: ${m.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

main();
