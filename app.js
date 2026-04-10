// Unregister any stale service workers
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
    });
}

const Navigation = Object.freeze({
    About: "ABOUT",
    Travel: "TRAVEL",
    Imprint: "IMPRINT",
});

const Language = Object.freeze({
    English: "en",
    Deutsch: "de"
});

const loading = document.getElementById("loading");
const navigation = document.getElementById("navigation");
const lines = document.getElementById("lines");
const input = document.getElementById("input");
const cursor = document.getElementById("cursor");
const footer = document.getElementById("footer");

// Set current year dynamically for footer
document.getElementById("footer-year").textContent = new Date().getFullYear();

const { language, command } = getUrlSearchParams();
const content = {};
let eCnt = 0;

// Add event listeners
document.addEventListener("keydown", checkInput);
document.addEventListener("paste", (event) => {
    const paste = (event.clipboardData || window.clipboardData).getData("text");
    if (paste) {
        event.preventDefault();
        // Remove linebreaks to keep it on one command line
        input.textContent += paste.replace(/[\r\n]+/g, ' ');
    }
});

// Putty-style: Left drag to auto-copy
document.addEventListener("mouseup", () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
        navigator.clipboard.writeText(selectedText).catch(err => console.error("Auto-copy failed", err));
    }
});

// Putty-style: Right-click to paste
document.addEventListener("contextmenu", async (event) => {
    // Allow context menu if right-clicking a link
    if (event.target.closest("a")) return;

    const selectedText = window.getSelection().toString();
    // Allow standard context menu if there's text selected (so they can manually copy if preferred)
    if (!selectedText) {
        event.preventDefault();
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                input.textContent += text.replace(/[\r\n]+/g, ' ');
            }
        } catch (err) {
            console.error("Right-click paste failed", err);
        }
    }
});

function getUrlSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        language: urlParams.get("lang") || Language.English,
        command: urlParams.get("command")?.toUpperCase() || null
    };
}

function setCanonicalTag() {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = `https://friscic.com/?lang=${language}${command ? `&command=${command}` : ""}`;
    document.head.appendChild(link);
    document.documentElement.lang = language;
}

function translate(json) {
    Object.entries(json).forEach(([key, entries]) => {
        content[key] = entries?.flatMap((obj) => {
            if (obj.ref && json[obj.ref]) {
                return json[obj.ref].map((t) =>
                    t.text ? { ...t, text: t.text[language] } : null
                ).filter(Boolean);
            } else if (obj.text) {
                return { ...obj, text: obj.text[language] };
            }
            return null;
        }).filter(Boolean) || [];
    });
}

function addNavigationItem(name) {
    const item = document.createElement("h2");
    const link = document.createElement("a");
    link.href = `?command=${name}&lang=${language}`;
    link.innerText = content[name]?.[0]?.text || name;
    item.appendChild(link);
    navigation.appendChild(item);
}

function addLanguageSwitch(lang) {
    const item = document.createElement("a");
    item.href = `?lang=${lang}${command ? `&command=${command}` : ""}`;
    item.innerText = lang;
    if (lang === language) {
        item.classList.add("highlight");
    }
    footer.append(item);
}

function newCommandLine(options = {}) {
    const line = document.createElement("div");

    if (options.highlight) {
        line.classList.add("highlight");
    }

    if (options.collapsed) {
        line.style.display = "none";
    }

    if (options.href) {
        const link = document.createElement("a");
        link.href = options.href;
        link.target = "_blank";
        link.innerText = options.text || "";
        line.append(link);
    } else {
        line.innerText = options.text
            ? options.text.replace("%I", input.textContent)
            : "";
    }

    lines.append(line);

    const warning = document.getElementById("ai-warning");
    const scrollTarget = warning && warning.style.display !== "none"
        ? warning
        : document.getElementById("stats") || document.getElementById("cmdl");
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "end" });

    return line;
}let warningShown = false;

function checkInput(event) {
    const key = event.key;
    
    // allow standard browser shortcuts (ctrl+r, ctrl+c, etc)
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    
    // Ignore function keys, shift, caps lock etc.
    if (key.length > 1 && !["Enter", "Backspace"].includes(key)) return;

    cursor.value = " "; // reset cursor for visual effect

    if (key === "Enter") {
        const currentInput = input.textContent;
        input.textContent = "";
        event.preventDefault();

        newCommandLine({ text: `~/${currentInput} ` });

        const commandText = currentInput.toUpperCase();

        if (commandText === "CLS" || commandText === "CLEAR") {
            lines.innerText = "";
            newCommandLine({ text: content[commandText]?.[0]?.text });
            return;
        }

        if (commandText === "ALL") {
            lines.innerText = "";
            newCommandLine({ text: Object.keys(content).join(', ') });
            return;
        }

        inputValidator(currentInput);
        return;
    } else if (key === "Backspace") {
        input.textContent = input.textContent.slice(0, -1);
        event.preventDefault();
    } else if (key.length === 1) { // Standard character input
        input.textContent += key;
        event.preventDefault();
    }
}

// Detect mobile devices to pick the right model size
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

// AI worker — spawned lazily on first AI request
let aiWorker = null;
let aiRequestId = 0;
const aiCallbacks = new Map();

function ensureWorker() {
    if (aiWorker) return;
    aiWorker = new Worker("./ai-worker.js", { type: "module" });
    aiWorker.onmessage = (e) => {
        const { id, result, error } = e.data;
        const cb = aiCallbacks.get(id);
        if (cb) {
            aiCallbacks.delete(id);
            cb(error ? null : result);
        }
    };
    aiWorker.postMessage({ type: "init", isMobile });
}

let aiInProgress = false;

function getAIResponse(userInput) {
    if (aiInProgress) return Promise.resolve(null);
    aiInProgress = true;
    ensureWorker();
    return new Promise((resolve) => {
        const id = ++aiRequestId;
        aiCallbacks.set(id, (result) => {
            aiInProgress = false;
            resolve(result);
        });
        aiWorker.postMessage({ userInput, id });
    });
}

function inputValidator(inputString = input.textContent) {
    const keyMatch = Object.keys(content).find((command) =>
        inputString.match(new RegExp(`^${command}`, "gi"))
    );
    const valueMatch = content[keyMatch];

    if (!inputString && !keyMatch) {
        newCommandLine({
            text: eCnt > 2
                ? `${eCnt > 10 ? content["ANGRY"]?.[0]?.text : content["CHEER"]?.[0]?.text}【#${eCnt}】empty`
                : content["EMPTY"]?.[0]?.text,
        });
        eCnt++;
    } else if (valueMatch?.length) {
        valueMatch.forEach((line) => newCommandLine(line));
    } else {
        // No match in data.json — show loading immediately, then ask AI
        if (!warningShown) {
            warningShown = true;
            document.getElementById("ai-warning").style.display = "block";
        }
        const placeholder = newCommandLine({ text: "░░░░░░░░░░" });
        placeholder.classList.add("ai-response");
        const totalBlocks = 10;
        let filled = 0;
        const loadingInterval = setInterval(() => {
            filled = (filled + 1) % (totalBlocks + 1);
            placeholder.innerText = "█".repeat(filled) + "░".repeat(totalBlocks - filled);
        }, 100);

        getAIResponse(inputString).then((aiText) => {
            clearInterval(loadingInterval);
            if (aiText) {
                placeholder.innerText = aiText;
            } else {
                placeholder.innerText = `'${inputString}' ¯\\_(ツ)_/¯`;
            }
        });
        eCnt = 0;
    }
}

// Async helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function typeText(text, delay) {
    for (const char of text) {
        input.textContent += char;
        await sleep(Math.random() * (delay.max - delay.min) + delay.min);
    }
}

function runOncePerDay() {
    const lastRun = localStorage.getItem('lastRun');
    const currentDate = new Date().toDateString();

    if (lastRun !== currentDate) {
        typeText("Hello", { min: 500, max: 1000 });
        localStorage.setItem('lastRun', currentDate);
    }
}

(async function start() {
    try {
        setCanonicalTag();

        const response = await fetch("./data.json");
        const json = await response.json();
        
        translate(json);

        if (command && content[command]) {
            const text = content[command][0]?.text;
            const currentPage = language !== Language.English
                ? text?.substring(3)
                : command.toLowerCase();
            document.title = `${currentPage} @ friscic | ${language.toLowerCase()}`;
            inputValidator(command);
        }

        Object.values(Language).forEach(addLanguageSwitch);
        Object.values(Navigation).forEach(addNavigationItem);
    } finally {
        document.getElementById("cmdl").scrollIntoView({ behavior: "smooth", block: "end" });
    }
})();

runOncePerDay();

// Copy name to clipboard with visual feedback
document.getElementById("copy-name").addEventListener("click", function() {
    const el = this;
    navigator.clipboard.writeText("Friščić").then(() => {
        const original = el.textContent;
        el.textContent = "✓ copied";
        el.style.color = "#41ff00";
        el.style.fontSize = "0.7rem";
        setTimeout(() => { el.textContent = original; el.style.fontSize = ""; }, 1200);
    });
});
