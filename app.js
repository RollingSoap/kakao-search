const messages = [];

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const authorFilter = document.getElementById("authorFilter");
const statsDiv = document.getElementById("stats");
const resultCount = document.getElementById("resultCount");
    
const loading = document.getElementById("loading");

const searchTime = document.getElementById("searchTime");

const contextModal =
    document.getElementById("contextModal");

const contextContent =
    document.getElementById("contextContent");

const closeModal =
    document.getElementById("closeModal");

const startDate =
document.getElementById("startDate");

const endDate =
    document.getElementById("endDate");

async function loadFile(file) {

    loading.style.display = "block";
    loading.textContent = "파일 분석중... 잠시만 기다려주세요.";

    // 화면 먼저 갱신
    await new Promise(resolve =>
        setTimeout(resolve, 10)
    );

    messages.length = 0;

    const text = await file.text();

    parseKakao(text);

    loadAuthors();

    statsDiv.innerHTML =
        `총 메시지 수: ${messages.length.toLocaleString()}`;

    loading.style.display = "none";
}

fileInput.addEventListener("change", async (e) => {
    loadFile(e.target.files[0]);
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

function convertDate(dateStr) {

    const match =
        dateStr.match(
            /(\d+)년\s(\d+)월\s(\d+)일/
        );

    if (!match) return "";

    const year = match[1];
    const month =
        match[2].padStart(2,"0");
    const day =
        match[3].padStart(2,"0");

    return `${year}-${month}-${day}`;
}

function loadAuthors() {

    const counts = {};

    for (const msg of messages) {

        counts[msg.author] =
            (counts[msg.author] || 0) + 1;
    }

    const authors =
        Object.entries(counts)
            .sort((a,b)=>b[1]-a[1]);

    authorFilter.innerHTML =
        `<option value="">전체 작성자</option>`;

    for (const [author,count] of authors) {

        const option =
            document.createElement("option");

        option.value = author;

        option.textContent =
            `${author} (${count.toLocaleString()})`;

        authorFilter.appendChild(option);
    }
}

searchBtn.addEventListener("click", searchMessages);

function searchMessages() {

    const searchStart =
        performance.now();

    const query =
        searchInput.value.trim();

    if (!query) {
        alert("검색어를 입력해주세요.");
        return;
    }

    const author =
        authorFilter.value;

    const startDateValue =
        startDate.value;

    const endDateValue =
        endDate.value;

    const keywords =
        query.split(/\s+/).filter(Boolean);

    const results = messages
        .map((msg, index) => ({
            ...msg,
            originalIndex: index
        }))
        .filter(msg => {

            if (author && msg.author !== author)
                return false;

            const msgDate =
                convertDate(msg.date);

            if (startDateValue &&
                msgDate < startDateValue)
                return false;

            if (endDateValue &&
                msgDate > endDateValue)
                return false;

            return keywords.every(keyword =>
                msg.text.toLowerCase().includes(
                    keyword.toLowerCase()
                )
            );
        });

    const searchEnd =
        performance.now();

    searchTime.textContent =
        `검색 시간: ${((searchEnd - searchStart) / 1000).toFixed(3)}초`;

    results.reverse();

    renderResults(results);
}

function renderResults(results) {

    const originalCount = results.length;

    results = results.slice(0,100);

    resultCount.textContent =
        `${originalCount.toLocaleString()}개 검색됨 (최대 100개 표시)`;

    resultsDiv.innerHTML = "";

    for (const msg of results) {

        const div =
            document.createElement("div");

        div.className = "message";

        div.innerHTML = `
            <div class="author">${msg.author}</div>
            <div class="date">${msg.date} ${msg.time}</div>
            <div>${highlight(msg.text)}</div>
            <button class="contextBtn">
                전후 대화 보기
            </button>
        `;

        div.querySelector(".contextBtn")
            .addEventListener("click", () => {

                showContext(msg.originalIndex);

        });

        resultsDiv.appendChild(div);
    }
}

function highlight(text) {

    const keywords =
        searchInput.value
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    let result = text;

    for (const keyword of keywords) {

        const escaped =
            keyword.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        result =
            result.replace(
                new RegExp(escaped,"gi"),
                match =>
                    `<mark>${match}</mark>`
            );
    }

    return result;
}

function showContext(index) {

    const start =
        Math.max(0, index - 5);

    const end =
        Math.min(messages.length, index + 6);

    contextContent.innerHTML = "";

    for (let i = start; i < end; i++) {

        const msg = messages[i];

        const div =
            document.createElement("div");

        div.className =
            i === index
                ? "context-message context-current"
                : "context-message";

        div.innerHTML = `
            <div><b>${msg.author}</b></div>
            <div>${msg.date} ${msg.time}</div>
            <div>${msg.text}</div>
        `;

        contextContent.appendChild(div);
    }

    contextModal.style.display = "block";
}

dropZone.addEventListener("click", () => {
    fileInput.click();
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {

    e.preventDefault();

    dropZone.classList.remove("dragover");

    const file =
        e.dataTransfer.files[0];

    if (!file) return;

    loadFile(file);
});

searchInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter") {
        searchMessages();
    }

});

closeModal.addEventListener("click", () => {
    contextModal.style.display = "none";
});

window.addEventListener("click", (e) => {

    if (e.target === contextModal) {
        contextModal.style.display = "none";
    }

});
