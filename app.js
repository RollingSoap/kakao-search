const messages = [];

const fileInput = document.getElementById("fileInput");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const authorFilter = document.getElementById("authorFilter");
const statsDiv = document.getElementById("stats");

fileInput.addEventListener("change", async (e) => {

    messages.length = 0;

    const file = e.target.files[0];
    const text = await file.text();

    parseKakao(text);

    loadAuthors();

    statsDiv.innerHTML =
        `총 메시지 수: ${messages.length}`;
});

function parseKakao(text) {

    const lines = text.split(/\r?\n/);

    let currentDate = "";

    const msgRegex =
        /^\[(.*?)\]\s\[(오전|오후)\s(\d+):(\d+)\]\s(.*)$/;

    let currentMessage = null;

    for (const line of lines) {

        const dateMatch =
            line.match(/---------------\s(.+?)\s---------------/);

        if (dateMatch) {
            currentDate = dateMatch[1];
            continue;
        }

        const msgMatch = line.match(msgRegex);

        if (msgMatch) {

            if (currentMessage) {
                messages.push(currentMessage);
            }

            let hour = parseInt(msgMatch[3]);

            if (msgMatch[2] === "오후" && hour !== 12)
                hour += 12;

            if (msgMatch[2] === "오전" && hour === 12)
                hour = 0;

            currentMessage = {
                date: currentDate,
                author: msgMatch[1],
                time:
                    `${hour.toString().padStart(2, "0")}:${msgMatch[4]}`,
                text: msgMatch[5]
            };

        } else {

            if (currentMessage) {
                currentMessage.text += "\n" + line;
            }
        }
    }

    if (currentMessage) {
        messages.push(currentMessage);
    }
}

function loadAuthors() {

    const authors = [...new Set(messages.map(x => x.author))]
        .sort();

    authorFilter.innerHTML =
        `<option value="">전체 작성자</option>`;

    for (const author of authors) {

        const option =
            document.createElement("option");

        option.value = author;
        option.textContent = author;

        authorFilter.appendChild(option);
    }
}

searchBtn.addEventListener("click", searchMessages);

function searchMessages() {

    const query =
        searchInput.value.trim();

    const author =
        authorFilter.value;

    const keywords =
        query.split(/\s+/).filter(Boolean);

    const results = messages.filter(msg => {

        if (author && msg.author !== author)
            return false;

        return keywords.every(keyword =>
            msg.text.includes(keyword)
        );
    });

    renderResults(results);
}

function renderResults(results) {

    resultsDiv.innerHTML = "";

    for (const msg of results) {

        const div =
            document.createElement("div");

        div.className = "message";

        div.innerHTML = `
            <div class="author">${msg.author}</div>
            <div class="date">${msg.date} ${msg.time}</div>
            <div>${msg.text}</div>
        `;

        resultsDiv.appendChild(div);
    }
}