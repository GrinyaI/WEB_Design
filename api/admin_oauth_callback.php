<?php
session_start();
$config = require __DIR__ . '/oauth_config.php';

$provider = $_GET['provider'] ?? '';
if (!$provider || !isset($config['providers'][$provider])) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown provider']);
    exit;
}

if (!isset($_GET['state']) || !isset($_SESSION['oauth_state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid state']);
    exit;
}
unset($_SESSION['oauth_state']);

if (!isset($_GET['code'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Code not provided']);
    exit;
}

$code = $_GET['code'];
$prov = $config['providers'][$provider];
$redirect_uri = $config['base_url'] . $config['callback_path'] . '?provider=' . urlencode($provider);

function curl_post($url, $postFields, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) return ['error' => $err];
    return ['body' => $res];
}

$token = null;
if ($provider === 'github') {
    $post = [
        'client_id' => $prov['client_id'],
        'client_secret' => $prov['client_secret'],
        'code' => $code,
        'redirect_uri' => $redirect_uri,
        'state' => $_GET['state']
    ];
    $r = curl_post($prov['token_url'], http_build_query($post), ['Accept: application/json']);
    if (isset($r['error'])) { http_response_code(500); echo json_encode(['error'=>$r['error']]); exit; }
    $tokenResp = json_decode($r['body'], true);
    $token = $tokenResp['access_token'] ?? null;
    if (!$token) { http_response_code(500); echo json_encode(['error'=>'No access_token']); exit; }

    $ch = curl_init($prov['userinfo_url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token $token",
        "User-Agent: MyAdminApp"
    ]);
    $userinfo_raw = curl_exec($ch);
    curl_close($ch);
    $profile = json_decode($userinfo_raw, true);
    $provider_user_id = $profile['id'] ?? null;
    $provider_name = $profile['name'] ?? $profile['login'] ?? null;

    $provider_email = null;
    $ch = curl_init($prov['emails_url']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token $token",
        "User-Agent: MyAdminApp",
        "Accept: application/vnd.github.v3+json"
    ]);
    $emails_raw = curl_exec($ch);
    curl_close($ch);
    $emails = json_decode($emails_raw, true);
    if (is_array($emails)) {
        foreach ($emails as $e) {
            if (!empty($e['primary']) && !empty($e['verified'])) { $provider_email = $e['email']; break; }
        }
        if (!$provider_email && isset($emails[0]['email'])) $provider_email = $emails[0]['email'];
    }
}

if (!$provider_user_id) {
    http_response_code(500);
    echo json_encode(['error'=>'No provider user id']);
    exit;
}

$servername = "localhost";
$dbuser = "videouser";
$dbpass = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $dbuser, $dbpass, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error'=>'DB connection failed']);
    exit;
}
$conn->set_charset("utf8mb4");

$stmt = $conn->prepare("SELECT asa.admin_user_id, au.username, au.is_active FROM admin_social_accounts asa JOIN admin_users au ON asa.admin_user_id = au.id WHERE asa.provider = ? AND asa.provider_user_id = ? LIMIT 1");
$stmt->bind_param('ss', $provider, $provider_user_id);
$stmt->execute();
$res = $stmt->get_result();
$map = $res->fetch_assoc();
$stmt->close();

if (!$map) {
    http_response_code(403);
    echo "<h3>Доступ запрещён</h3><p>Социальный аккаунт не связан с администратором.</p>";
    $conn->close();
    exit;
}

if (intval($map['is_active']) !== 1) {
    http_response_code(403);
    echo "<h3>Учётная запись администратора деактивирована</h3>";
    $conn->close();
    exit;
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$map['admin_user_id'];
$_SESSION['admin_username'] = $map['username'];
$_SESSION['is_admin'] = true;

$adminUrl = '/admin.html';
header("Location: $adminUrl");
exit;
?>