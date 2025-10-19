<?php
header('Content-Type: application/json');
$servername = "localhost";
$username = "videouser";
$password = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql_popular = "SELECT
                    f.*,
                    d.name AS director,
                    GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
                FROM films f
                JOIN directors d ON f.director_id = d.id
                LEFT JOIN film_genre fg ON f.id = fg.film_id
                LEFT JOIN genres g ON fg.genre_id = g.id
                WHERE f.is_popular = 1
                GROUP BY f.id";
$result_popular = $conn->query($sql_popular);

$sql_new = "SELECT
                f.*,
                d.name AS director,
                GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
            FROM films f
            JOIN directors d ON f.director_id = d.id
            LEFT JOIN film_genre fg ON f.id = fg.film_id
            LEFT JOIN genres g ON fg.genre_id = g.id
            WHERE f.is_new = 1
            GROUP BY f.id";
$result_new = $conn->query($sql_new);

$popular_films = [];
while($row = $result_popular->fetch_assoc()) {
    $popular_films[] = $row;
}

$new_films = [];
while($row = $result_new->fetch_assoc()) {
    $new_films[] = $row;
}

echo json_encode([
    'popular' => $popular_films,
    'new' => $new_films
]);

$conn->close();
?>