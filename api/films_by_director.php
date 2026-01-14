<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

$director_id = isset($_GET['director']) ? intval($_GET['director']) : 0;

if ($director_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный ID режиссера']);
    $conn->close();
    exit;
}

$stmt_director = $conn->prepare("SELECT
                    id,
                    name AS title,
                    bio,
                    birthdate AS birthday,
                    photo_url AS poster,
                    (SELECT COUNT(*) FROM films WHERE director_id = ?) AS filmsCount,
                    ROUND((SELECT AVG(rating) FROM films WHERE director_id = ?), 1) AS rating
                 FROM directors
                 WHERE id = ?");
$stmt_director->bind_param('iii', $director_id, $director_id, $director_id);
$stmt_director->execute();
$result_director = $stmt_director->get_result();
$director = $result_director->fetch_assoc();
$stmt_director->close();

if (!$director) {
    http_response_code(404);
    echo json_encode(['error' => 'Режиссер не найден']);
    $conn->close();
    exit;
}

$stmt_films = $conn->prepare("SELECT
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
             WHERE f.director_id = ?
             GROUP BY f.id");
$stmt_films->bind_param('i', $director_id);
$stmt_films->execute();
$result_films = $stmt_films->get_result();
$films = [];
while ($row = $result_films->fetch_assoc()) {
    $films[] = $row;
}
$stmt_films->close();

echo json_encode([
    'director' => $director,
    'films' => $films
]);

$conn->close();
?>