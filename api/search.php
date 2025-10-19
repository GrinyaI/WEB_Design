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

$query = isset($_GET['q']) ? $conn->real_escape_string($_GET['q']) : '';

$sql = "SELECT
            f.id,
            f.title,
            f.year,
            f.rating,
            f.poster_url AS poster,
            d.name AS director,
            GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
        FROM films f
        JOIN directors d ON f.director_id = d.id
        LEFT JOIN film_genre fg ON f.id = fg.film_id
        LEFT JOIN genres g ON fg.genre_id = g.id
        WHERE
            f.title LIKE '%$query%'
            OR d.name LIKE '%$query%'
            OR g.name LIKE '%$query%'
        GROUP BY f.id";

$result = $conn->query($sql);

$films = [];
while($row = $result->fetch_assoc()) {
    $films[] = $row;
}

echo json_encode($films);

$conn->close();
?>