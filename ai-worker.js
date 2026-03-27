import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

// Use browser cache to avoid re-downloading the model
env.useBrowserCache = true;
env.allowLocalModels = false;

let generator = null;

async function initAI() {
    if (generator) return;
    generator = await pipeline(
        "text-generation",
        "onnx-community/Qwen2.5-0.5B-Instruct",
        { dtype: "q4", device: "webgpu" }
    ).catch(() => pipeline(
        "text-generation",
        "onnx-community/Qwen2.5-0.5B-Instruct",
        { dtype: "q4" }
    ));
}

// Only load model on demand — do NOT call initAI() here

self.onmessage = async (e) => {
    const { userInput, id } = e.data;
    try {
        await initAI();
        if (!generator) {
            self.postMessage({ id, error: "Model unavailable" });
            return;
        }

        const messages = [
            {
                role: "system",
                content: "You are a funny retro terminal. User typed a command. Reply with a short, witty console error. Rules: 1) Max 30 chars. 2) No quotes around your reply. 3) No explanation. Just the error text. Style guide: Use kaomoji faces like (ಠ_ಠ), ¯\\_(ツ)_/¯, (╯°□°)╯ as prefix/suffix. Make puns on the command name when possible (e.g. CAT=meow, PING=PONG, TOUCH=no touchy). Mix fake CLI errors with humor (e.g. 'permission denied', 'not found', 'disk full'). Keep it uppercase terminal style."
            },
            { role: "user", content: userInput }
        ];

        const output = await generator(messages, {
            max_new_tokens: 15,
            temperature: 0.8,
            top_p: 0.9,
            do_sample: true,
        });

        const raw = output?.[0]?.generated_text;
        const reply = Array.isArray(raw)
            ? raw.filter(m => m.role === "assistant").pop()?.content || ""
            : String(raw || "");

        const cleaned = reply.trim().substring(0, 30);
        self.postMessage({ id, result: cleaned || null });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
