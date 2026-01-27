<!DOCTYPE html>
<html lang="us">

<head>
    <meta charset="UTF-8">
    <title>Persona 5 Royal - Negotiation Questions</title>
</head>
<body>
    <h2>Negotiation Questions</h2>
    <form action="negotiation-questions.php" method="get">
        <input type="text" id="question_ref" name="question_ref">
        <button type="submit">
            Search
        </button>
    </form>
    <div>
    <?php 
        $question_ref =  $_GET["question_ref"] ?? "";
        class Question
        {
            public function __construct(
                private string $title, 
                private array $answer = []
                ){}
            public function get_title(): string{
                return $this->title;
            }
            public function get_answer(): array{
                return $this->answer;
            }
            public function set_title($title): void{
                $this->title = $title;
            }  
            public function set_answer($answer): void{
                $this->answer = $answer;
            }
        }  
        class Answer
        {
            public function __construct(
                private string  $text, 
                private int $options
                ){}
            public function get_text(): string{
                return $this->text;
            }
            public function set_text(string $text): void{
                $this->text = $text;
            }
            public function get_options(): int{
                return $this->options;
            }
            public function set_options(int $options): void{
                $this->options = $options;
            }
        }

        $questions_csv = fopen(filename: "questions.csv", mode: "r");
        $questions_line = fgets(stream: $questions_csv);
        $raw_data = [] ;

        while (($questions_line = fgetcsv($questions_csv)) !== FALSE) {
            if ( $question_ref !== "" && stripos(haystack: $questions_line[0], needle: $question_ref) !== false) {
                $options = [];
                for ( $i = 1; $i < count(value: $questions_line); $i += 2 ) {
                    $answer = new Answer(text: trim(string: $questions_line[$i]),options: (int) trim(string: $questions_line[$i + 1]));
                    $options[] = $answer;
                }
                $raw_data[] = new Question(title: $questions_line[0],answer: $options);
            }
        }
        fclose(stream: $questions_csv);

        foreach ($raw_data as $line) {
            echo "
                <details>
                    <summary>{$line->get_title()}</summary>
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                <th>gloomy</th>
                                <th>irritable</th>
                                <th>timid</th>
                                <th>upbeat</th>
                            </tr>
                        </thead>
                        <tbody>";
            foreach ($line->get_answer() as $answer) {
                $info = (int) $answer->get_options();
                echo "
                            <tr>
                                <td>{$answer->get_text()}</td>";
                for ($i = 3; $i >= 0; $i--) {
                    
                    if($i == 0){
                        $quality = $info % 10;
                    }else{
                        $quality = intdiv(num1: $info, num2: pow(num: 10, exponent: $i));
                        $info = $info % pow(num: 10,exponent: $i);
                    }
                    switch ($quality) {
                        case 1:
                            echo "<td>BAD</td>";
                            break;
                        case 2:
                            echo "<td><i>OK</i></td>";
                            break;
                        case 3:
                            echo "<td><b>GOOD</b></td>";
                            break;
                        default:
                        echo "<td></td>";
                    }
                }
                                
                echo "
                            </tr>";
            }
        echo "
                        </tbody>
                    </table>
                </details>";
        }
    ?>
    </div>
</body>
</html>