<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_id']) || empty($_SESSION['is_admin'])) {
    http_response_code(401);
    echo json_encode(['error'=>'Требуется авторизация']);
    exit;
}

$servername = "localhost";
$username = "videouser";
$password = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8mb4");
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error'=>'DB connection failed']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("
            SELECT f.*, d.name AS director
            FROM films f
            LEFT JOIN directors d ON f.director_id = d.id
            WHERE f.id = ?
            LIMIT 1
        ");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $film = $res->fetch_assoc();
        $stmt->close();
        if (!$film) {
            http_response_code(404);
            echo json_encode(['error'=>'Фильм не найден']);
            $conn->close();
            exit;
        }
        echo json_encode($film, JSON_UNESCAPED_UNICODE);
        $conn->close();
        exit;
    }

    $sql = "SELECT f.id, f.title, f.year, f.rating, f.poster_url, f.director_id, d.name AS director, f.is_new, f.is_popular
            FROM films f
            LEFT JOIN directors d ON f.director_id = d.id
            ORDER BY f.id DESC";
    $result = $conn->query($sql);
    $list = [];
    while ($row = $result->fetch_assoc()) $list[] = $row;
    echo json_encode($list, JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'create') {
        $title = $_POST['title'] ?? '';
        $year = intval($_POST['year'] ?? 0);
        $rating = floatval($_POST['rating'] ?? 0);
        $director_id = intval($_POST['director_id'] ?? 0);
        $is_new = isset($_POST['is_new']) ? 1 : 0;
        $is_popular = isset($_POST['is_popular']) ? 1 : 0;

        $poster_url = null;
        if (!empty($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
            $uploaddir = __DIR__ . '/../img/films/';
            if (!is_dir($uploaddir)) mkdir($uploaddir, 0755, true);
            $fname = basename($_FILES['poster']['name']);
            $ext = pathinfo($fname, PATHINFO_EXTENSION);
            $allowed = ['jpg','jpeg','png','webp'];
            if (!in_array(strtolower($ext), $allowed)) {
                http_response_code(400);
                echo json_encode(['error'=>'Неподдерживаемый формат изображения']);
                exit;
            }
            $target = $uploaddir . $fname;
            if (!move_uploaded_file($_FILES['poster']['tmp_name'], $target)) {
                http_response_code(500);
                echo json_encode(['error'=>'Не удалось сохранить файл']);
                exit;
            }
            $poster_url = 'img/films/' . $fname;
        }

        $stmt = $conn->prepare("INSERT INTO films (title, director_id, year, rating, poster_url, is_new, is_popular) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('siidsii', $title, $director_id, $year, $rating, $poster_url, $is_new, $is_popular);
        $ok = $stmt->execute();
        if (!$ok) {
            http_response_code(500);
            echo json_encode(['error'=>'Ошибка при добавлении: ' . $stmt->error]);
            $stmt->close();
            $conn->close();
            exit;
        }
        $newId = $stmt->insert_id;
        $stmt->close();
        echo json_encode(['success'=>true, 'id'=>$newId]);
        $conn->close();
        exit;
    }

    if ($action === 'update') {
        $id = intval($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error'=>'id не указан']); exit; }
        $title = $_POST['title'] ?? '';
        $year = intval($_POST['year'] ?? 0);
        $rating = floatval($_POST['rating'] ?? 0);
        $director_id = intval($_POST['director_id'] ?? 0);
        $is_new = isset($_POST['is_new']) ? 1 : 0;
        $is_popular = isset($_POST['is_popular']) ? 1 : 0;

        $poster_url = null;
        if (!empty($_FILES['poster']) && $_FILES['poster']['error'] === UPLOAD_ERR_OK) {
            $uploaddir = __DIR__ . '/../img/films/';
            if (!is_dir($uploaddir)) mkdir($uploaddir, 0755, true);
            $fname = basename($_FILES['poster']['name']);
            $ext = pathinfo($fname, PATHINFO_EXTENSION);
            $allowed = ['jpg','jpeg','png','webp'];
            if (!in_array(strtolower($ext), $allowed)) {
                http_response_code(400);
                echo json_encode(['error'=>'Неподдерживаемый формат изображения']);
                exit;
            }
            $target = $uploaddir . $fname;
            if (!move_uploaded_file($_FILES['poster']['tmp_name'], $target)) {
                http_response_code(500);
                echo json_encode(['error'=>'Не удалось сохранить файл']);
                exit;
            }
            $poster_url = 'img/films/' . $fname;
        }

        if ($poster_url) {
            $stmt = $conn->prepare("UPDATE films SET title=?, director_id=?, year=?, rating=?, poster_url=?, is_new=?, is_popular=? WHERE id=?");
            $stmt->bind_param('siidsiii', $title, $director_id, $year, $rating, $poster_url, $is_new, $is_popular, $id);
        } else {
            $stmt = $conn->prepare("UPDATE films SET title=?, director_id=?, year=?, rating=?, is_new=?, is_popular=? WHERE id=?");
            $stmt->bind_param('siidiii', $title, $director_id, $year, $rating, $is_new, $is_popular, $id);
        }
        $ok = $stmt->execute();
        if (!$ok) {
            http_response_code(500);
            echo json_encode(['error'=>'Ошибка при обновлении: ' . $stmt->error]);
            $stmt->close();
            $conn->close();
            exit;
        }
        $stmt->close();
        echo json_encode(['success'=>true]);
        $conn->close();
        exit;
    }

    if ($action === 'delete') {
        $id = intval($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error'=>'id не указан']); exit; }
        $stmt = $conn->prepare("DELETE FROM films WHERE id = ?");
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        if (!$ok) {
            http_response_code(500);
            echo json_encode(['error'=>'Ошибка при удалении: ' . $stmt->error]);
            $stmt->close();
            $conn->close();
            exit;
        }
        $stmt->close();
        echo json_encode(['success'=>true]);
        $conn->close();
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Неверный action']);
    $conn->close();
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Метод не поддерживается']);
?>