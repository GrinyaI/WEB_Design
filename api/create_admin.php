<?php
// CLI script: php create_admin.php username password
if (php_sapi_name() !== 'cli') {
    echo "This script must be run from CLI.\n";
    exit(1);
}

if ($argc < 3) {
    echo "Usage: php create_admin.php <username> <password>\n";
    exit(1);
}

$username = $argv[1];
$password = $argv[2];

$servername = "localhost";
$dbuser = "videouser";
$dbpass = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $dbuser, $dbpass, $dbname);
if ($conn->connect_error) {
    echo "DB connect error: " . $conn->connect_error . "\n";
    exit(1);
}
$conn->set_charset("utf8mb4");

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)");
$stmt->bind_param('ss', $username, $hash);
if ($stmt->execute()) {
    echo "Admin user created with ID: " . $stmt->insert_id . "\n";
} else {
    echo "Error inserting user: " . $stmt->error . "\n";
}
$stmt->close();
$conn->close();
?>