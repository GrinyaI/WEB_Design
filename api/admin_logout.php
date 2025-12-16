<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$config = null;
$haveConfig = false;
$configPath = __DIR__ . '/oauth_config.php';
if (file_exists($configPath)) {
    $config = require $configPath;
    $haveConfig = is_array($config) && isset($config['providers']['github']);
}

$provider = $_SESSION['oauth_provider'] ?? null;
$accessToken = $_SESSION['oauth_access_token'] ?? null;

if ($provider === 'github' && $accessToken && $haveConfig) {
    $prov = $config['providers']['github'];
    $clientId = $prov['client_id'];
    $clientSecret = $prov['client_secret'];

    $url = "https://api.github.com/applications/" . urlencode($clientId) . "/token";

    $payload = json_encode(['access_token' => $accessToken]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_USERPWD, $clientId . ':' . $clientSecret);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/vnd.github.v3+json',
        'Content-Type: application/json',
        'User-Agent: MyAdminApp'
    ]);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);
    if ($curlErr) {
        error_log("GitHub revoke error: $curlErr");
    } elseif ($httpCode < 200 || $httpCode >= 300) {
        error_log("GitHub revoke returned HTTP $httpCode: $resp");
    }
}

$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'] ?? '/',
        $params['domain'] ?? '',
        $params['secure'] ?? false,
        $params['httponly'] ?? true
    );
}

session_destroy();

echo json_encode(['success' => true]);
exit;
?>
