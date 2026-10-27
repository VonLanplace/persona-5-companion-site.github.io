/* ==========================================================================
   Negotiation search
   Data is injected as window.P5_QUESTIONS by the build (negotiation-data.js),
   so this works without a network round-trip and from file:// as well.
   ========================================================================== */

(function () {
    "use strict";

    var QUESTIONS = window.P5_QUESTIONS || [];
    var PERSONALITIES = ["Gloomy", "Irritable", "Timid", "Upbeat"];
    var GRADE_CLASS = { BAD: "grade-bad", OK: "grade-ok", GOOD: "grade-good" };

    var form = document.getElementById("search-form");
    var input = document.getElementById("question-ref");
    var clearBtn = document.getElementById("clear-btn");
    var results = document.getElementById("results");
    var status = document.getElementById("form-status");

    if (!form || !input || !results) return;

    function cell(tag, text, className) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (text != null) el.textContent = text;
        return el;
    }

    /** Render the four translated grades in personality order. */
    function gradeCells(grades) {
        return PERSONALITIES.map(function (name) {
            var value = grades[name.toLowerCase()] || "";
            var td = cell("td", value);
            if (GRADE_CLASS[value]) {
                td.className = GRADE_CLASS[value];
            }
            return td;
        });
    }

    function renderQuestion(question) {
        var details = document.createElement("details");
        details.appendChild(cell("summary", question.q));

        var wrap = cell("div", null, "table-wrap");
        var tbl = document.createElement("table");

        var thead = document.createElement("thead");
        var headRow = document.createElement("tr");
        headRow.appendChild(cell("th", "Response"));
        PERSONALITIES.forEach(function (name) {
            headRow.appendChild(cell("th", name));
        });
        thead.appendChild(headRow);
        tbl.appendChild(thead);

        var tbody = document.createElement("tbody");
        question.a.forEach(function (answer) {
            var tr = document.createElement("tr");
            tr.appendChild(cell("td", answer.text));
            gradeCells(answer.grades).forEach(function (td) {
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        wrap.appendChild(tbl);

        details.appendChild(wrap);
        return details;
    }

    function search(raw) {
        var query = raw.trim().toLowerCase();
        results.textContent = "";

        if (!query) {
            if (status) status.textContent = "";
            return;
        }

        var matches = QUESTIONS.filter(function (question) {
            return question.q.toLowerCase().indexOf(query) !== -1;
        });

        if (status) {
            status.textContent = matches.length
                ? matches.length + (matches.length === 1 ? " question" : " questions") + " found"
                : "No questions match \u201c" + raw.trim() + "\u201d";
        }

        if (!matches.length) return;

        var frag = document.createDocumentFragment();
        matches.forEach(function (question) {
            frag.appendChild(renderQuestion(question));
        });
        results.appendChild(frag);
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        search(input.value);
    });

    input.addEventListener("search", function () {
        search(input.value);
    });

    if (clearBtn) {
        clearBtn.addEventListener("click", function () {
            input.value = "";
            search("");
            input.focus();
        });
    }

    // Deep link support: negotiation/index.html?q=timeout
    var initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
        input.value = initial;
        search(initial);
    }
})();
