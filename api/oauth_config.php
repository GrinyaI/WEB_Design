<?php
require_once 'secret.php';

return [
    'base_url' => 'http://localhost:8080',
    'callback_path' => '/api/admin_oauth_callback.php',

    'providers' => [
        'github' => [
            'client_id' => $CLIENT_ID,
            'client_secret' => $CLIENT_SECRET,
            'auth_url' => 'https://github.com/login/oauth/authorize',
            'token_url' => 'https://github.com/login/oauth/access_token',
            'userinfo_url' => 'https://api.github.com/user',
            'emails_url' => 'https://api.github.com/user/emails',
            'scope' => 'user:email'
        ]
    ],
];
?>