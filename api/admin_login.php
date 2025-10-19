<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error'=>'Метод не поддерживается']);
    exit;
}

$ADMIN_USER = 'admin';
$ADMIN_PASS = 'adminpass';

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if ($username === $ADMIN_USER && $password === $ADMIN_PASS) {
    session_regenerate_id(true);
    $_SESSION['is_admin'] = true;
    echo json_encode(['success'=>true]);
} else {
    http_response_code(401);
    echo json_encode(['error'=>'Неверные учётные данные']);
}
?>