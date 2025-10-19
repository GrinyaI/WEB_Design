<?php
$servername = "localhost";
$username = "videouser";
$password = "password123";
$dbname = "videoteka";

$conn = new mysqli($servername, $username, $password, $dbname);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully to database: " . $dbname;

$conn->close();
?>