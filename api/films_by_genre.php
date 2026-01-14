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

$genre_name = isset($_GET['genre']) ? trim($_GET['genre']) : '';

if (empty($genre_name)) {
    http_response_code(400);
    echo json_encode(['error' => 'Жанр не указан']);
    $conn->close();
    exit;
}

$stmt_genre = $conn->prepare("SELECT
                g.id,
                g.name,
                g.bio,
                g.icon,
                COUNT(f.id) AS film_count,
                AVG(f.rating) AS avg_rating,
                MIN(f.year) AS oldest_year
              FROM genres g
              LEFT JOIN film_genre fg ON g.id = fg.genre_id
              LEFT JOIN films f ON fg.film_id = f.id
              WHERE g.name = ?
              GROUP BY g.id");
$stmt_genre->bind_param('s', $genre_name);
$stmt_genre->execute();
$genre_result = $stmt_genre->get_result();

$genre_data = $genre_result->fetch_assoc();
$stmt_genre->close();

if (!$genre_data) {
    http_response_code(404);
    echo json_encode(['error' => 'Жанр не найден']);
    $conn->close();
    exit;
}

$stmt_films = $conn->prepare("SELECT
                 f.*,
                 d.name AS director,
                 GROUP_CONCAT(DISTINCT g2.name ORDER BY g2.name SEPARATOR ', ') AS genres
               FROM films f
               JOIN directors d ON f.director_id = d.id
               JOIN film_genre fg ON f.id = fg.film_id
               JOIN genres g ON fg.genre_id = g.id
               LEFT JOIN film_genre fg2 ON f.id = fg2.film_id
               LEFT JOIN genres g2 ON fg2.genre_id = g2.id
               WHERE g.name = ?
               GROUP BY f.id");
$stmt_films->bind_param('s', $genre_name);
$stmt_films->execute();
$films_result = $stmt_films->get_result();
$films = [];
while($row = $films_result->fetch_assoc()) {
    $films[] = $row;
}
$stmt_films->close();

echo json_encode([
    'genre' => $genre_data,
    'films' => $films
]);

$conn->close();
?>