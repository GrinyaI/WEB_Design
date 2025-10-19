<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

$u = trim($_POST['username'] ?? '');
$p = $_POST['password'] ?? '';

if ($u === '' || $p === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Заполните логин и пароль']);
    exit;
}

$servername = "localhost";
$dbuser = "videouser";
$dbpass = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $dbuser, $dbpass, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}
$conn->set_charset("utf8mb4");

$stmt = $conn->prepare("SELECT id, username, password_hash, is_active, failed_attempts, last_failed_at FROM admin_users WHERE username = ? LIMIT 1");
$stmt->bind_param('s', $u);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Неверные учётные данные']);
    $conn->close();
    exit;
}

if (!$user['is_active']) {
    http_response_code(403);
    echo json_encode(['error' => 'Учётная запись деактивирована']);
    $conn->close();
    exit;
}

$failedAttempts = (int)$user['failed_attempts'];
$lastFailedAt = $user['last_failed_at'] ? new DateTime($user['last_failed_at']) : null;
$now = new DateTime();
$lockoutThreshold = 5;
$lockoutMinutes = 15;

if ($failedAttempts >= $lockoutThreshold && $lastFailedAt) {
    $diff = $now->getTimestamp() - $lastFailedAt->getTimestamp();
    if ($diff < ($lockoutMinutes * 60)) {
        http_response_code(429);
        echo json_encode(['error' => "Учётная запись заблокирована. Повторите попытку через " . ceil((($lockoutMinutes*60) - $diff)/60) . " минут."]);
        $conn->close();
        exit;
    }
}

$hash = $user['password_hash'];
if (!password_verify($p, $hash)) {
    $failedAttempts++;
    $stmt = $conn->prepare("UPDATE admin_users SET failed_attempts = ?, last_failed_at = NOW() WHERE id = ?");
    $stmt->bind_param('ii', $failedAttempts, $user['id']);
    $stmt->execute();
    $stmt->close();

    http_response_code(401);
    echo json_encode(['error' => 'Неверные учётные данные']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("UPDATE admin_users SET failed_attempts = 0, last_failed_at = NULL WHERE id = ?");
$stmt->bind_param('i', $user['id']);
$stmt->execute();
$stmt->close();

if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
    $newHash = password_hash($p, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
    $stmt->bind_param('si', $newHash, $user['id']);
    $stmt->execute();
    $stmt->close();
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$user['id'];
$_SESSION['admin_username'] = $user['username'];
$_SESSION['is_admin'] = true;

echo json_encode(['success' => true, 'username' => $user['username']]);
$conn->close();
exit;
?>