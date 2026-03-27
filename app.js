import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

const EventType = Object.freeze({
    KeyDown: "keydown",
    KeyPress: "keypress",
    Input: "input",
});

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
const head = document.getElementsByTagName("head");

const { language, command } = getUrlSearchParams();
const content = {};
let eCnt = 0;

// Add event listeners
Object.values(EventType).forEach((eventType) => {
    document.addEventListener(eventType, (event) => checkInput(event, eventType));
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
    head[0].appendChild(link);
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

    window.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: "smooth",
    });

    return line;
}

let enterHandled = false;

function checkInput(event, eventType) {
    const eventId = (event.data || event.key || event.inputType)?.toUpperCase();
    cursor.value = " "; // reset cursor for visual effect

    if (!eventId) {
        newCommandLine({ text: content["OOPS"]?.[0]?.text });
        return;
    }

    if (eventId === "ENTER") {
        // Guard against multiple event types firing for the same Enter press
        if (enterHandled) return;
        enterHandled = true;
        setTimeout(() => { enterHandled = false; }, 50);

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
    } else if (eventId === "DELETECONTENTBACKWARD" || eventId === "BACKSPACE") {
        input.textContent = input.textContent.slice(0, -1);
        event.preventDefault();
    } else if (eventType === EventType.KeyPress || (eventType === EventType.Input && event.data)) {
        input.textContent += event.key || event.data;
        event.preventDefault();
    }
}

// Detect mobile devices to pick the right model size
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

// AI worker for off-main-thread inference
let aiWorker = null;
let aiRequestId = 0;
const aiCallbacks = new Map();

aiWorker = new Worker("./ai-worker.js", { type: "module" });
aiWorker.onmessage = (e) => {
    const { id, result, error } = e.data;
    const cb = aiCallbacks.get(id);
    if (cb) {
        aiCallbacks.delete(id);
        cb(error ? null : result);
    }
};

// Tell the worker which device we're on
aiWorker.postMessage({ type: "init", isMobile });

function getAIResponse(userInput) {
    return new Promise((resolve) => {
        const id = ++aiRequestId;
        aiCallbacks.set(id, resolve);
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
    setCanonicalTag();

    await fetch("./data.json")
        .then(response => response.json())
        .then(json => {
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
        })
        .finally(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
})();

runOncePerDay();
