<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_id']) || empty($_SESSION['is_admin'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$display = '';
if (!empty($_SESSION['admin_email'])) {
    $display = $_SESSION['admin_email'];
} elseif (!empty($_SESSION['admin_username'])) {
    $display = $_SESSION['admin_username'];
}

echo json_encode([
    'id' => (int)$_SESSION['admin_id'],
    'username' => $_SESSION['admin_username'] ?? '',
    'email' => $_SESSION['admin_email'] ?? '',
    'provider' => $_SESSION['auth_provider'] ?? null,
    'display' => $display
]);
exit;
?>
