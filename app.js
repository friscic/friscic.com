const EventType = Object.freeze({
    KeyDown: "keydown",
    KeyPress: "keypress",
    Input: "input",
});
const Navigation = Object.freeze({
    About: "ABOUT",
    Contact: "CONTACT",
    Imprint: "IMPRINT",
});
const Language = Object.freeze({
    English: "en",
    Deutsch: "de"
});
let loading = document.getElementById("loading");
let navigation = document.getElementById("navigation");
let lines = document.getElementById("lines");
let input = document.getElementById("input");
let cursor = document.getElementById("cursor");
let footer = document.getElementById("footer");
let head = document.getElementsByTagName("head");
let [language, command] = getUrlSearchParams();
let content = {};
let eCnt = 0;

const addEventListener = (eventType) =>
    document.addEventListener(eventType, (event) =>
        checkInput(event, eventType)
    );

function getUrlSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang") || Language.English;
    const command = urlParams.get("command")?.toUpperCase();

    return [lang, command];
}

function setCanonicalTag() {
    var link = document.createElement('link');
    link.rel = 'canonical';
    link.href = command ? `https://friscic.com/?lang=${language}&amp;command=${command}` : `https://friscic.com/?lang=${language}`;

    head[0].appendChild(link);
}

function translate(json) {
    Object.entries(json).forEach((entry) => {
        content[entry[0]] =
            entry[1]?.flatMap((obj) =>
                obj.ref
                    ? json[obj.ref].map((t) =>
                        t.text
                            ? {
                                ...t,
                                text: t.text[language],
                            }
                            : d
                    )
                    : obj.text
                        ? {
                            ...obj,
                            text: obj.text[language],
                        }
                        : d
            ) || {};
    });
}

const addNavigationItem = (name) => {
    const item = document.createElement("h2");
    const link = document.createElement("a");
    link.href = `?command=${name}&lang=${language}`;
    link.innerText = content[name][0]?.text;

    item.appendChild(link);
    navigation.appendChild(item);
};

const addLanguageSwitch = (lang) => {
    const item = document.createElement("a");
    item.href = `?lang=${lang}&command=${command || ""}`;
    item.innerText = lang;

    if (lang === language) {
        item.classList.add("highlight");
    }

    footer.append(item);
};

function newCommandLine(options = {}) {
    const line = document.createElement("div");

    if (options.highlight) {
        line.className += " highlight";
    }

    if (options.collapsed) {
        line.style += "display: none;";
    }

    if (options.href) {
        let link = document.createElement("a");
        link.href = options.href;
        link.target = "_blank";
        link.innerText = options.text || "";
        line.append(link);
    } else {
        line.innerText = options.text
            ? options.text.replace("%I", input.innerText)
            : line.innerText;
    }

    lines.append(line);

    window.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: "smooth",
    });
}

const checkInput = (event, eventType) => {
    const eventId = (event.data || event.key || event.inputType)?.toUpperCase();
    cursor.value = " "; // hacking input value

    if (!eventId) {
        newCommandLine({ text: content["OOPS"][0]?.text });
    } else if (eventId === "ENTER") {
        newCommandLine({ text: `~/${input.innerText} ` });
        inputValidator();
        if (input.innerText === "CLS" || input.innerText === "CLEAR") {
            lines.innerText = "";
            newCommandLine({ text: content[input.innerText][0]?.text });
        }
        if (input.innerText === "ALL") {
            lines.innerText = "";
            newCommandLine({ text: Object.keys(content).map(k => k).join(', ') });
        }
        input.innerText = "";
        event.preventDefault();
    } else if (eventId === "DELETECONTENTBACKWARD" || eventId === "BACKSPACE") {
        input.innerText = input.innerText.substring(
            0,
            input.innerText.length - 1
        );
        event.preventDefault();
    } else if (eventType === EventType.KeyPress) {
        input.innerText += event.key;
        event.preventDefault();
    } else if (eventType === EventType.Input && event.data) {
        input.innerText += event.data;
        event.preventDefault();
    }
};

function inputValidator(inputString = input.innerText) {
    const keyMatch = Object.keys(content).find((command) =>
        inputString.match(new RegExp(`^${command}`, "gi"))
    );
    const valueMatch = content[keyMatch];

    if (!inputString && !keyMatch) {
        newCommandLine({
            text: eCnt > 2
                ? `${eCnt > 10 ? content["ANGRY"][0]?.text : content["CHEER"][0]?.text}【#${eCnt}】empty`
                : content["EMPTY"][0]?.text,
        });
        eCnt++;
    } else if (valueMatch?.length) {
        valueMatch.forEach((line) => newCommandLine(line));
    } else {
        newCommandLine({ text: `'${inputString}' IS NOT RECOGNIZED` });
        eCnt = 0;
    }
}

(async function start() {
    setCanonicalTag();

    await fetch("./data.json")
        .then((response) => response.json())
        .then((json) => {
            translate(json);

            if (command) {
                const text = content[command][0]?.text;
                const currentPage = language !== Language.English ? text.substring(3, text.length) : command.toLocaleLowerCase();
                document.title = `${currentPage} @ friscic | ${language.toLocaleLowerCase()}`;
                inputValidator(command);
            }

            Object.values(Language).forEach(addLanguageSwitch);
            Object.values(Navigation).forEach(addNavigationItem);
            Object.values(EventType).forEach(addEventListener);
        });
})();