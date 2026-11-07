/* ==========================================================================
   Negotiation search
   Data is injected as window.P5_NEGOTIATION by the build
   (negotiation-data.js), so this works without a network round-trip and from
   file:// as well. The page defaults to Royal; the selector switches between
   the P5 and Royal question sets.
   ========================================================================== */

(function () {
    "use strict";

    var DATA = window.P5_NEGOTIATION || {};
    var VERSIONS = {
        p5: { label: "Persona 5", questions: DATA.p5 || [] },
        royal: {
            label: "Persona 5 Royal",
            questions: DATA.royal || window.P5_QUESTIONS || [],
        },
    };
    var PERSONALITIES = ["Gloomy", "Irritable", "Timid", "Upbeat"];
    var GRADE_CLASS = { BAD: "grade-bad", OK: "grade-ok", GOOD: "grade-good" };

    var form = document.getElementById("search-form");
    var input = document.getElementById("question-ref");
    var clearBtn = document.getElementById("clear-btn");
    var results = document.getElementById("results");
    var status = document.getElementById("form-status");
    var p5Button = document.getElementById("version-p5");
    var royalButton = document.getElementById("version-royal");
    var versionButtons = [p5Button, royalButton].filter(Boolean);
    var currentVersion = "royal";

    if (!form || !input || !results) return;

    function cell(tag, text, className) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (text != null) el.textContent = text;
        return el;
    }

    function setVersion(version) {
        if (!VERSIONS[version]) version = "royal";
        currentVersion = version;

        versionButtons.forEach(function (button) {
            var active = button.getAttribute("data-version") === version;
            button.className = "version-switch__btn" + (active ? " is-active" : "");
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    /** Render the four translated grades in personality order. */
    function gradeCells(answer) {
        var grades = answer.grades || {};
        var notes = answer.notes || {};
        var unconfirmed = answer.unconfirmed || {};

        return PERSONALITIES.map(function (name) {
            var key = name.toLowerCase();
            var value = grades[key] || "";
            var td = cell("td", notes[key] || value);
            var classes = [];

            if (GRADE_CLASS[value]) classes.push(GRADE_CLASS[value]);
            if (unconfirmed[key]) {
                classes.push("grade-unconfirmed");
                td.title = "Unconfirmed";
                td.appendChild(cell("span", " (unconfirmed)", "visually-hidden"));
            }
            if (classes.length) td.className = classes.join(" ");

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
            gradeCells(answer).forEach(function (td) {
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        wrap.appendChild(tbl);

        details.appendChild(wrap);
        return details;
    }

    function renderVersionHeading() {
        var version = VERSIONS[currentVersion];
        var heading = cell("h3", null, "result-version");
        heading.appendChild(cell("span", version.label, "result-version__label"));
        if (currentVersion === "royal") {
            var badge = cell("span", "Royal", "badge badge--royal");
            badge.setAttribute("aria-hidden", "true");
            heading.appendChild(badge);
        }
        return heading;
    }

    function matchesQuestion(question, query) {
        if (question.q.toLowerCase().indexOf(query) !== -1) return true;

        return question.a.some(function (answer) {
            return (answer.text || "").toLowerCase().indexOf(query) !== -1;
        });
    }

    function search(raw) {
        var query = raw.trim().toLowerCase();
        var version = VERSIONS[currentVersion];
        results.textContent = "";

        if (!query) {
            if (status) status.textContent = "";
            return;
        }

        var matches = version.questions.filter(function (question) {
            return matchesQuestion(question, query);
        });

        if (status) {
            if (matches.length) {
                status.textContent =
                    matches.length +
                    (matches.length === 1 ? " question" : " questions") +
                    " found in " +
                    version.label;
            } else {
                status.textContent =
                    "No questions or responses match \u201c" +
                    raw.trim() +
                    "\u201d in " +
                    version.label;
            }
        }

        if (!matches.length) return;

        results.appendChild(renderVersionHeading());

        var frag = document.createDocumentFragment();
        matches.forEach(function (question) {
            frag.appendChild(renderQuestion(question));
        });
        results.appendChild(frag);
    }

    versionButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            setVersion(button.getAttribute("data-version"));
            search(input.value);
        });
    });

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

    // Deep link support: ?q=timeout, ?version=p5&q=timeout
    var params = new URLSearchParams(window.location.search);
    setVersion(params.get("version") || "royal");

    var initial = params.get("q");
    if (initial) {
        input.value = initial;
        search(initial);
    }
})();
