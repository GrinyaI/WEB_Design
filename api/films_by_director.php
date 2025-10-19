<?php
header('Content-Type: application/json');
$servername = "localhost";
$username = "videouser";
$password = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

$director_id = isset($_GET['director']) ? intval($_GET['director']) : 0;


$sql_director = "SELECT
                    id,
                    name AS title,
                    bio,
                    birthdate AS birthday,
                    photo_url AS poster,
                    (SELECT COUNT(*) FROM films WHERE director_id = $director_id) AS filmsCount,
                    ROUND((SELECT AVG(rating) FROM films WHERE director_id = $director_id), 1) AS rating
                 FROM directors
                 WHERE id = $director_id";

$result_director = $conn->query($sql_director);
$director = $result_director->fetch_assoc();


$sql_films = "SELECT
                f.id,
                f.title,
                f.year,
                f.rating,
                f.poster_url AS poster,
                f.is_new,
                GROUP_CONCAT(g.name SEPARATOR ', ') AS genre
             FROM films f
             LEFT JOIN film_genre fg ON f.id = fg.film_id
             LEFT JOIN genres g ON fg.genre_id = g.id
             WHERE f.director_id = $director_id
             GROUP BY f.id";

$result_films = $conn->query($sql_films);
$films = [];
while ($row = $result_films->fetch_assoc()) {
    $films[] = $row;
}

echo json_encode([
    'director' => $director,
    'films' => $films
]);

$conn->close();
?>