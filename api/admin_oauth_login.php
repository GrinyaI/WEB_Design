<?php
session_start();
$config = require __DIR__ . '/oauth_config.php';

$provider = $_GET['provider'] ?? '';
if (!$provider || !isset($config['providers'][$provider])) {
    http_response_code(400);
    echo "Unknown provider";
    exit;
}

$prov = $config['providers'][$provider];
$client_id = $prov['client_id'];
$auth_url = $prov['auth_url'];
$scope = $prov['scope'] ?? '';

$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;
$_SESSION['oauth_provider'] = $provider;

$redirect_uri = $config['base_url'] . $config['callback_path'] . '?provider=' . urlencode($provider);

if ($provider === 'github') {
    $params = [
        'client_id' => $client_id,
        'redirect_uri' => $redirect_uri,
        'state' => $state,
        'scope' => $scope
    ];
    $url = $auth_url . '?' . http_build_query($params);
    header('Location: ' . $url);
    exit;
}

http_response_code(400);
echo "Provider not implemented";
exit;
?>