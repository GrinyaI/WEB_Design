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

$sql = "SELECT
            d.id,
            d.name AS title,
            (SELECT COUNT(*) FROM films WHERE director_id = d.id) AS films,
            ROUND(AVG(f.rating), 1) AS rating,
            d.bio,
            d.photo_url AS poster,
            GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres
        FROM directors d
        LEFT JOIN films f ON d.id = f.director_id
        LEFT JOIN film_genre fg ON f.id = fg.film_id
        LEFT JOIN genres g ON fg.genre_id = g.id
        GROUP BY d.id
        ORDER BY d.name";

$result = $conn->query($sql);

$directors = [];
while($row = $result->fetch_assoc()) {
    $directors[] = $row;
}

echo json_encode($directors);

$conn->close();
?>