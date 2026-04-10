let pipeline = null;

async function loadLibrary() {
    if (pipeline) return;
    const module = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js");
    pipeline = module.pipeline;
    // Enable persistent browser caching for model weights via Cache API
    module.env.useBrowserCache = true;
    module.env.allowLocalModels = false;
    module.env.cacheKey = "transformers-cache";
}

let generator = null;
let isMobile = false;

// Only load model on demand — do NOT call initAI() here

function sanitizeInput(text) {
    // Limit input length to prevent prompt injection attempts
    return text.substring(0, 30).replace(/[^\w\s\-./]/g, "");
}

async function initAI() {
    if (generator) return;
    await loadLibrary();

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
                content: "You are a funny, broken retro terminal. Reply ONLY with a 3-6 word error message in ALL CAPS related to the user's input. Include exactly one emoji. NO conversational text, NO explanations, NO quotes. Format strictly like: 🗑️ TRASH COMMAND BRO, 💩 CRAPPED OUT LOL, 👻 GHOST IN MACHINE, 🛸 ABDUCTED BY ALIENS, 📉 STONKS DOWN BRUH, 💻 BRICKED MYSELF RIP"
            },
            { role: "user", content: safeInput }
        ];

        const output = await generator(messages, {
            max_new_tokens: 10,
            temperature: 0.8,
            top_p: 0.9,
            do_sample: true,
        });

        const raw = output?.[0]?.generated_text;
        const reply = Array.isArray(raw)
            ? raw.filter(m => m.role === "assistant").pop()?.content || ""
            : String(raw || "");

        const getRandomEmoji = () => {
            // Picking from major valid emoji Unicode blocks (Smileys, Symbols, Transport, Suppl.)
            const blocks = [[0x1F600, 0x1F64F], [0x1F300, 0x1F5FF], [0x1F680, 0x1F6FF], [0x1F900, 0x1F9FF]];
            const [min, max] = blocks[Math.floor(Math.random() * blocks.length)];
            return String.fromCodePoint(Math.floor(Math.random() * (max - min + 1)) + min);
        };
        const trimmed = reply.trim();
        const hasEmoji = /\p{Emoji_Presentation}/u.test(trimmed);
        const emoji = hasEmoji ? "" : getRandomEmoji();
        let cleaned = trimmed.substring(0, 36) + ".." + emoji;
        self.postMessage({ id, result: cleaned || null });
    } catch (err) {
        self.postMessage({ id, error: err.message });
    }
};