  /**
 * SCRIPT CENTRAL - PERSONA 5 ROYAL COMPANION
 */

// Armazenamento global para as questões de negociação
let allQuestions = [];

// 1. CARREGAMENTO INICIAL
document.addEventListener("DOMContentLoaded", () => {
    // Carrega as seções principais no index
    loadHTML("confidants", "confidants-guide.html");
    loadHTML("classroom", "classroom-exam-answers.html");
    loadHTML("shadows", "shadows-locations.html");
    loadHTML("negotiation", "negotiation-questions.html", setupNegotiationSearch);
});

// 2. FUNÇÃO DE CARREGAMENTO DE HTML
function loadHTML(elementId, file, callback = null) {
    fetch(file)
        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar " + file);
            return response.text();
        })
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            // Se houver uma função específica para rodar após carregar, executa aqui
            if (callback) callback();
        })
        .catch(error => {
            console.error("Erro no fetch:", error);
            document.getElementById(elementId).innerHTML = "<p>Erro ao carregar seção.</p>";
        });
}

// 3. LÓGICA DOS CONFIDANTS
function carregarGuia(arquivo) {
    const areaConteudo = document.getElementById('conteudo-confidant');
    const divisor = document.getElementById('divisor');

    if (!areaConteudo) return;

    fetch('confidants/' + arquivo + '.html')
        .then(response => {
            if (!response.ok) throw new Error('Personagem não encontrado');
            return response.text();
        })
        .then(html => {
            if (divisor) divisor.style.display = 'block';
            areaConteudo.innerHTML = html;
            areaConteudo.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error(error);
            areaConteudo.innerHTML = '<p>Erro ao carregar dados do Confidant.</p>';
        });
}

function limparConteudo() {
    const area = document.getElementById('conteudo-confidant');
    const divi = document.getElementById('divisor');
    if (area) area.innerHTML = '';
    if (divi) divi.style.display = 'none';
}

// 4. LÓGICA DE NEGOCIAÇÃO (CSV)
function setupNegotiationSearch() {
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) return;

    // Carrega o CSV apenas quando a seção de negociação for montada
    fetch("questions.csv")
        .then(response => response.text())
        .then(text => {
            const lines = text.split("\n");
            allQuestions = []; // Reseta a lista

            lines.forEach(line => {
                if (!line.trim()) return;
                const cols = line.split(";");
                const title = cols[0];
                const answers = [];
                for (let i = 1; i < cols.length; i += 2) {
                    if (cols[i] && cols[i+1]) {
                        answers.push({ text: cols[i], options: parseInt(cols[i+1]) });
                    }
                }
                allQuestions.push({ title, answers });
            });
        });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('question_ref').value.toLowerCase();
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = "";

        const filtered = allQuestions.filter(q => q.title.toLowerCase().includes(query));

        filtered.forEach(q => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = q.title;
            details.appendChild(summary);

            const table = document.createElement("table");
            table.innerHTML = `
                <thead>
                    <tr><th>Resposta</th><th>Gloomy</th><th>Irritable</th><th>Timid</th><th>Upbeat</th></tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector("tbody");

            q.answers.forEach(a => {
                const tr = document.createElement("tr");
                const tdText = document.createElement("td");
                tdText.textContent = a.text;
                tr.appendChild(tdText);

                // Lógica para extrair os valores 1, 2 ou 3 do número de 4 dígitos
                let optString = a.options.toString().padStart(4, '0');
                for (let i = 0; i < 4; i++) {
                    const td = document.createElement("td");
                    const val = optString[i];
                    if (val === "1") td.textContent = "BAD";
                    if (val === "2") td.innerHTML = "<i>OK</i>";
                    if (val === "3") td.innerHTML = "<b>GOOD</b>";
                    tr.appendChild(td);
                }
                tbody.appendChild(tr);
            });
            details.appendChild(table);
            resultsContainer.appendChild(details);
        });
    });
}