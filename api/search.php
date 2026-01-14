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

$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query)) {
    echo json_encode([]);
    $conn->close();
    exit;
}

$search_term = '%' . $conn->real_escape_string($query) . '%';

$stmt = $conn->prepare("SELECT
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
            f.title LIKE ?
            OR d.name LIKE ?
            OR g.name LIKE ?
        GROUP BY f.id");
$stmt->bind_param('sss', $search_term, $search_term, $search_term);
$stmt->execute();
$result = $stmt->get_result();

$films = [];
while($row = $result->fetch_assoc()) {
    $films[] = $row;
}
$stmt->close();

echo json_encode($films);

$conn->close();
?>