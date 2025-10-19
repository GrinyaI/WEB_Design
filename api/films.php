<?php
header('Content-Type: application/json');
$servername = "localhost";
$username = "videouser";
$password = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) die("Connection failed: " . $conn->connect_error);

$sql = "SELECT
            f.*,
            d.name AS director,
            GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
        FROM films f
        JOIN directors d ON f.director_id = d.id
        LEFT JOIN film_genre fg ON f.id = fg.film_id
        LEFT JOIN genres g ON fg.genre_id = g.id
        GROUP BY f.id";
$result = $conn->query($sql);

$films = [];
while($row = $result->fetch_assoc()) {
    $films[] = $row;
}

echo json_encode($films);
$conn->close();
?>