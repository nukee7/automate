"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
async function listModels() {
    const client = new genai_1.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });
    const models = await client.models.list();
    for await (const model of models) {
        console.log(model.name);
    }
}
listModels().catch(console.error);
