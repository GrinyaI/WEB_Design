<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_id']) || empty($_SESSION['is_admin'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Требуется авторизация']);
    exit;
}

$servername = "localhost";
$username   = "videouser";
$password   = "password123";
$dbname     = "videoteka";

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);

        $stmt = $conn->prepare("
            SELECT id, name
            FROM directors
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $director = $res->fetch_assoc();
        $stmt->close();

        if (!$director) {
            http_response_code(404);
            echo json_encode(['error' => 'Режиссёр не найден']);
            $conn->close();
            exit;
        }

        echo json_encode($director, JSON_UNESCAPED_UNICODE);
        $conn->close();
        exit;
    }

    $sql = "
        SELECT id, name
        FROM directors
        ORDER BY name ASC
    ";
    $result = $conn->query($sql);

    $list = [];
    while ($row = $result->fetch_assoc()) {
        $list[] = $row;
    }

    echo json_encode($list, JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Метод не поддерживается']);
$conn->close();
exit;
