<?php ?>
<!DOCTYPE html>
<html lang="us">
    <head>
        <meta charset="UTF-8">
        <title>Persona 5 Royal - Companion Site</title>
    </head>
    <body>
        <div>

        </div>
        <div>
            <h2>Confidants Guide</h2>
            <form action="index.php" method="get">
                <table>
                    <tr>
                        <td>
                            <button type="submit" name="arcana" value="0">
                                <img src="imagens/125x125/00-Fool---Igor.png" alt="Arcana 0">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="1">
                                <img src="imagens/125x125/01-Magician---Morgana.png" alt="Arcana 1">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="2">
                                <img src="imagens/125x125/02-Priestess---Makoto.png" alt="Arcana 2">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="3">
                                <img src="imagens/125x125/03-Empress---Haru.png" alt="Arcana 3">
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button type="submit" name="arcana" value="4">
                                <img src="imagens/125x125/04-Emperor---Yusuke.png" alt="Arcana 4">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="5">
                                <img src="imagens/125x125/05-Hierophant---Sojiro.png" alt="Arcana 5">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="6">
                                <img src="imagens/125x125/06-Lovers---Ann.png" alt="Arcana 6">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="7">
                            <img src="imagens/125x125/07-Chariot---Ryuji.png" alt="Arcana 7">
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button type="submit" name="arcana" value="8">
                                <img src="imagens/125x125/08-Justice---Akechi.png" alt="Arcana 8">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="9">
                                <img src="imagens/125x125/09-Hermit---Futaba.png" alt="Arcana 9">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="10">
                                <img src="imagens/125x125/10-Fortune---Chihaya.png" alt="Arcana 10">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="11">
                                <img src="imagens/125x125/11-Strength---Twins.png" alt="Arcana 11">
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button type="submit" name="arcana" value="12">
                                <img src="imagens/125x125/12-Hanged-Man---Iwai.png" alt="Arcana 12">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="13">
                                <img src="imagens/125x125/13-Death---Takemi.png" alt="Arcana 13">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="14">
                                <img src="imagens/125x125/14-Temperance---Kawakami.png" alt="Arcana 14">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="15">
                                <img src="imagens/125x125/15-Devil---Ohya.png" alt="Arcana 15">
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button type="submit" name="arcana" value="16">
                                <img src="imagens/125x125/16-Tower---Shinya.png" alt="Arcana 16">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="17">
                                <img src="imagens/125x125/17-Star---Hifumi.png" alt="Arcana 17">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="18">
                                <img src="imagens/125x125/18-Moon---Mishima.png" alt="Arcana 18">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="19">
                                <img src="imagens/125x125/19-Sun---Yoshida.png" alt="Arcana 19">
                            </button>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <button type="submit" name="arcana" value="20">
                                <img src="imagens/125x125/20-Judgement---Sae.png" alt="Arcana 20">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="21">
                                <img src="imagens/125x125/XXI-Faith---Kasumi.png" alt="Arcana 21">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="22">
                                <img src="imagens/125x125/XXII-Councillor---Maruki.png" alt="Arcana 22">
                            </button>
                        </td>
                        <td>
                            <button type="submit" name="arcana" value="-1">
                                <img src="imagens/125x125/XXII-Councillor---Maruki.png" alt="Arcana -1">
                            </button>
                        </td>
                    </tr>
                </table>
            </form>

            <div>
                <?php


                    switch ($arcana):
                    case 0:
                        include 'confidants/00-Fool.html';
                    break;

                    case 1:
                        include 'confidants/01-Magician.html';
                    break;

                    default:

                    endswitch;
                ?>
            </div>  
        </div>
    </body>
</html>