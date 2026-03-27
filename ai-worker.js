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

function sanitizeInput(text) {
    // Limit input length to prevent prompt injection attempts
    return text.substring(0, 30).replace(/[^\w\s\-./]/g, "");
}

self.onmessage = async (e) => {
    const { userInput, id } = e.data;
    try {
        await initAI();
        if (!generator) {
            self.postMessage({ id, error: "Model unavailable" });
            return;
        }

        const safeInput = sanitizeInput(userInput);

        const messages = [
            {
                role: "system",
                content: "You are a funny retro terminal. User typed a command. Reply with a short, witty console error. Rules: 1) Max 40 chars. 2) No quotes around your reply. 3) No explanation. Just the error text. 4) Keep it family-friendly and inoffensive. 5) Never discuss politics, religion, or adult content. 6) ALWAYS include at least one emoji related to the response. Style guide: Use kaomoji faces like (ಠ_ಠ), ¯\\_(ツ)_/¯, (╯°□°)╯ as prefix/suffix. Make puns on the command name when possible (e.g. CAT=🐱meow, PING=🏓PONG, TOUCH=🚫no touchy). Mix fake CLI errors with humor (e.g. '🔒permission denied', '🔍not found', '💾disk full'). Keep it uppercase terminal style."
            },
            { role: "user", content: safeInput }
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

        let cleaned = reply.trim();
        const wasTruncated = cleaned.length > 40;
        cleaned = cleaned.substring(0, wasTruncated ? 38 : 40);
        if (wasTruncated) cleaned += "..";
        // Ensure at least one emoji is present
        const hasEmoji = /\p{Emoji_Presentation}/u.test(cleaned);
        const result = hasEmoji ? cleaned : `⚠ ${cleaned}`;
        self.postMessage({ id, result: result.substring(0, 40) || null });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};
