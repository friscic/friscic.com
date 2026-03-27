let pipeline = null;

const MODEL_CACHE = "ai-model-cache-v1";

// IndexedDB helpers for caching large model files
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(MODEL_CACHE, 1);
        req.onupgradeneeded = () => req.result.createObjectStore("models");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getFromDB(key) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction("models", "readonly");
        const req = tx.objectStore("models").get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}

async function putInDB(key, data) {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction("models", "readwrite");
        tx.objectStore("models").put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

// Override fetch to cache model files by stable key (strip signed params)
const originalFetch = self.fetch.bind(self);
self.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : input.url;

    const isModelFile = url.includes("onnx") || url.includes("xethub") || url.includes("cdn-lfs") || url.includes("resolve/main");
    if (isModelFile) {
        let stableKey;
        try {
            const u = new URL(url);
            stableKey = u.origin + u.pathname;
        } catch (e) {
            return originalFetch(input, init);
        }

        try {
            // Check IndexedDB cache
            const cached = await getFromDB(stableKey);
            if (cached) {
                return new Response(cached.blob, {
                    status: 200,
                    headers: { "Content-Type": cached.type }
                });
            }

            const response = await originalFetch(input, { ...init, redirect: "follow" });
            if (response.ok) {
                const blob = await response.blob();
                // Store in IndexedDB (handles large files)
                await putInDB(stableKey, { blob, type: blob.type || "application/octet-stream" });
                return new Response(blob, {
                    status: 200,
                    headers: { "Content-Type": blob.type || "application/octet-stream" }
                });
            }
            return response;
        } catch (e) {
            return originalFetch(input, init);
        }
    }

    return originalFetch(input, init);
};

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