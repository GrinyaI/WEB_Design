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

$genre_name = isset($_GET['genre']) ? $conn->real_escape_string($_GET['genre']) : '';


$genre_sql = "SELECT
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
              WHERE g.name = '$genre_name'
              GROUP BY g.id";

$genre_result = $conn->query($genre_sql);
$genre_data = $genre_result->fetch_assoc();


$films_sql = "SELECT
                 f.*,
                 d.name AS director,
                 GROUP_CONCAT(DISTINCT g2.name ORDER BY g2.name SEPARATOR ', ') AS genres
               FROM films f
               JOIN directors d ON f.director_id = d.id
               JOIN film_genre fg ON f.id = fg.film_id
               JOIN genres g ON fg.genre_id = g.id
               LEFT JOIN film_genre fg2 ON f.id = fg2.film_id
               LEFT JOIN genres g2 ON fg2.genre_id = g2.id
               WHERE g.name = '$genre_name'
               GROUP BY f.id";

$films_result = $conn->query($films_sql);
$films = [];
while($row = $films_result->fetch_assoc()) {
    $films[] = $row;
}

echo json_encode([
    'genre' => $genre_data,
    'films' => $films
]);

if (!$genre_data) {
    http_response_code(404);
    echo json_encode(['error' => 'Жанр не найден']);
    exit;
}

$conn->close();
?>