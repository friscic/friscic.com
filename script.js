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
    Deutsch: "de",
});
const [language, page] = getUrlSearchParams();
const content = {};
// let loading = document.getElementById("loading");
//let container = document.getElementById("container");
let navigation = document.getElementById("navigation");
let lines = document.getElementById("lines");
let input = document.getElementById("input");
let cursor = document.getElementById("cursor");
let footer = document.getElementById("footer");

async function start() {
    // loder(input ? 2000 : 10);
    await fetch("./data.json")
        .then((response) => response.json())
        .then((json) => {
            translate(json);
            init();
        });
}

function init() {
    if (page) {
        inputValidator(page);
    }

    Object.values(Language).forEach(addLanguageSwitch);
    Object.values(Navigation).forEach(addNavigationItem);
    Object.values(EventType).forEach(addEventListener);
}

// function loder(timeout) {
    // container.style.display = "none";
    // setTimeout(() => {
    //     container.style.display = "";
    //     loading.style.display = "none";
    // }, timeout);
// }

function getUrlSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang") || Language.English;

    return [lang, urlParams.get("page")?.toUpperCase()];
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
    link.href = `?page=${name}&lang=${language}`;
    link.innerText = content[name][0]?.text;
    item.appendChild(link);
    navigation.appendChild(item);
};

const addLanguageSwitch = (lang) => {
    const item = document.createElement("a");
    item.href = `?lang=${lang}&page=${page || ""}`;
    item.innerText = lang;
    if (lang === language) {
        item.classList.add("highlight");
    }
    footer.append(item);
};

const addEventListener = (eventType) =>
    document.addEventListener(eventType, (event) =>
        checkInput(event, eventType)
    );

const checkInput = (event, eventType) => {
    cursor.value = " ";
    const eventId = (event.data || event.key || event.inputType)?.toUpperCase();

    if (!eventId) {
        newLine({ text: `(⊘_⊘）ups...` });
        return;
    }

    if (eventId === "ENTER") {
        newLine({ text: `~/${input.innerText} ` });
        inputValidator();
        if (input.innerText === "CLS") {
            lines.innerText = "";
        }
        input.innerText = "";
        event.preventDefault();

        return;
    }

    if (eventId === "DELETECONTENTBACKWARD" || eventId === "BACKSPACE") {
        input.innerText = input.innerText.substr(0, input.innerText.length - 1);
        event.preventDefault();

        return;
    }

    if (eventType === EventType.KeyPress) {
        input.innerText += event.key;
        event.preventDefault();

        return;
    }

    if (eventType === EventType.Input && event.data) {
        input.innerText += event.data;
        event.preventDefault();

        return;
    }
};

function newLine(options) {
    const line = document.createElement("div");

    if (!options) {
        lines.innerText = "";
    }

    if (options.highlight) {
        line.className += " highlight";
    }

    if (options.href) {
        let link = document.createElement("a");
        link.href = options.href;
        link.target = "_blank";
        link.innerText = options.text;
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

function inputValidator(inputString = input.innerText) {
    const keyMatch = Object.keys(content).find((command) =>
        inputString.match(new RegExp(`^${command}`, "gi"))
    );

    if (!inputString && !keyMatch) {
        newLine({ text: `¯\\_(ツ)_/¯TRY 'HELP'` });

        return;
    }

    const valueMatch = content[keyMatch];

    if (valueMatch && valueMatch.length) {
        valueMatch.forEach((line) => newLine(line));
    } else {
        newLine({ text: `'${inputString}' IS NOT RECOGNIZED` });
    }

    // if (!valueMatch) {
    //     lines.innerText = "";
    // }
}

start();
