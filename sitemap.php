<?php
header('Content-Type: application/xml; charset=utf-8');

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'example.com';
$base = $scheme . '://' . $host . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
if ($base === $scheme . '://' . $host) {
    $base .= '';
}

$staticPages = [
    '/',
    '/index.html',
    '/pages/genres.html',
    '/pages/films.html',
    '/pages/directors.html',
    '/pages/films_by_genre.html',
    '/pages/films_by_director.html',
    '/pages/admin.html',
    '/pages/403.html',
    '/pages/404.html',
];

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php foreach ($staticPages as $path): ?>
    <url>
        <loc><?php echo htmlspecialchars($base . $path, ENT_QUOTES | ENT_XML1, 'UTF-8'); ?></loc>
        <changefreq>weekly</changefreq>
        <priority><?php echo $path === '/' || $path === '/index.html' ? '1.0' : '0.7'; ?></priority>
    </url>
<?php endforeach; ?>
</urlset>

