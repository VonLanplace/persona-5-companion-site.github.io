<!DOCTYPE html>
<html lang="us">
<head>
    <meta charset="UTF-8">
    <title>Persona 5 Royal - Companion Site</title>

    <script>
        function loadHTML(elementId, file) {
            fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Erro ao carregar " + file);
                    }
                    return response.text();
                })
                .then(data => {
                    document.getElementById(elementId).innerHTML = data;
                })
                .catch(error => {
                    document.getElementById(elementId).innerHTML =
                        "<p>Erro ao carregar conteúdo.</p>";
                    console.error(error);
                });
        }

        document.addEventListener("DOMContentLoaded", () => {
            loadHTML("confidants", "confidants-guide.html");
            loadHTML("classroom", "classroom-exam-answers.html");
            loadHTML("shadows", "shadows-locations.html");
            loadHTML("negotiation", "negotiation-questions.html");
        });
    </script>
</head>
<body>
    <h1>Persona 5 Royal - Companion Site</h1>

    <br><hr>
    <div id="confidants"></div>

    <br><hr>
    <div id="classroom"></div>

    <br><hr>
    <div id="shadows"></div>

    <br><hr>
    <div id="negotiation"></div>

    <br><hr>
</body>
</html>
