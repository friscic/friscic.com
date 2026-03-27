import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

// Use browser cache to avoid re-downloading the model
env.useBrowserCache = true;
env.allowLocalModels = false;

let generator = null;
let isMobile = false;

// Only load model on demand — do NOT call initAI() here

function sanitizeInput(text) {
    // Limit input length to prevent prompt injection attempts
    return text.substring(0, 30).replace(/[^\w\s\-./]/g, "");
}

async function initAI() {
    if (generator) return;

    // Mobile: use SmolLM2-135M (lighter, ~134MB q4f16)
    // Desktop: use Qwen2.5-0.5B (better quality, ~300MB q4)
    const model = isMobile
        ? "HuggingFaceTB/SmolLM2-135M-Instruct"
        : "onnx-community/Qwen2.5-0.5B-Instruct";

    const dtype = isMobile ? "q4f16" : "q4";

    generator = await pipeline(
        "text-generation",
        model,
        { dtype, device: "webgpu" }
    ).catch(() => pipeline(
        "text-generation",
        model,
        { dtype }
    ));
}

self.onmessage = async (e) => {
    // Handle init message with device info
    if (e.data.type === "init") {
        isMobile = e.data.isMobile;
        return;
    }

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
            max_new_tokens: 20,
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