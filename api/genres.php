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
            g.id,
            g.name,
            g.icon,
            COUNT(fg.film_id) AS film_count
        FROM genres g
        LEFT JOIN film_genre fg ON g.id = fg.genre_id
        GROUP BY g.id
        ORDER BY film_count DESC";

$result = $conn->query($sql);

$genres = [];
while($row = $result->fetch_assoc()) {
    $genres[] = $row;
}

echo json_encode($genres);

$conn->close();
?>