<?php
/**
 * Одноразовый скрипт для создания БД `videoteka` и всех таблиц.
 *
 * Как использовать:
 * 1. При необходимости измените логин/пароль MySQL ниже.
 * 2. Откройте в браузере `http://your-host/api/create_database.php`
 *    или выполните в консоли: php api/create_database.php
 * 3. После успешного развёртывания БД скрипт можно удалить или закрыть от внешнего доступа.
 */

header('Content-Type: text/plain; charset=utf-8');

$host = 'localhost';
$user = 'root';
$pass = 'root';

$mysqli = new mysqli($host, $user, $pass);

if ($mysqli->connect_error) {
    http_response_code(500);
    die("Ошибка подключения к MySQL: " . $mysqli->connect_error . PHP_EOL);
}

$mysqli->set_charset('utf8mb4');

$sql = <<<'SQL'
CREATE DATABASE IF NOT EXISTS `videoteka`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `videoteka`;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `failed_attempts` int NOT NULL DEFAULT '0',
  `last_failed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_social_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_user_id` int NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider_user` (`provider`,`provider_user_id`),
  KEY `admin_id_idx` (`admin_user_id`),
  CONSTRAINT `fk_social_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `directors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `bio` text,
  `birthdate` date DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `films` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `director_id` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `rating` decimal(3,1) DEFAULT NULL,
  `poster_url` varchar(255) DEFAULT NULL,
  `is_new` tinyint(1) DEFAULT NULL,
  `is_popular` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `director_id` (`director_id`),
  CONSTRAINT `films_ibfk_1` FOREIGN KEY (`director_id`) REFERENCES `directors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `genres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `bio` text,
  `icon` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `film_genre` (
  `film_id` int NOT NULL,
  `genre_id` int NOT NULL,
  PRIMARY KEY (`film_id`,`genre_id`),
  KEY `genre_id` (`genre_id`),
  CONSTRAINT `film_genre_ibfk_1` FOREIGN KEY (`film_id`) REFERENCES `films` (`id`),
  CONSTRAINT `film_genre_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `is_active`, `failed_attempts`, `last_failed_at`, `created_at`) VALUES
(1, 'admin', '$2y$12$nvGo3X5QO8tziQdYW2WJ2ODIc5mP9Ws/.zHicXBIlBpq16J70Y2lu', 1, 0, NULL, '2025-10-20 00:01:56');

INSERT INTO `admin_social_accounts` (`id`, `admin_user_id`, `provider`, `provider_user_id`, `provider_email`, `created_at`) VALUES
(1, 1, 'github', '124897074', 'grinevich2018@mail.ru', '2025-10-23 00:04:35');

INSERT INTO `directors` (`id`, `name`, `bio`, `birthdate`, `photo_url`) VALUES
(1, 'Фрэнсис Форд Коппола', 'Американский кинорежиссёр, сценарист и продюсер итальянского происхождения.', '1939-04-07', '/img/directors/francis.webp'),
(2, 'Кристофер Ноланн', 'Британский и американский кинорежиссёр, сценарист и продюсер.', NULL, '/img/directors/nollan.webp'),
(3, 'Фрэнк Дарабонт', 'Американский кинорежиссёр и сценарист венгерского происхождения.', NULL, '/img/directors/darabont.jpg'),
(4, 'Дени Вильнёв', 'Канадский кинорежиссёр и сценарист.', NULL, '/img/directors/villeneuve.jpg'),
(5, 'Адам МакКей', 'Американский кинорежиссёр, сценарист и продюсер.', NULL, '/img/directors/mckay.jpg'),
(6, 'Крэйг Гиллеспи', 'Австралийский кинорежиссёр и продюсер.', NULL, '/img/directors/gillespie.jpg');

INSERT INTO `films` (`id`, `title`, `director_id`, `year`, `rating`, `poster_url`, `is_new`, `is_popular`) VALUES
(1, 'Крестный отец', 1, 1972, 9.2, '/img/films/krestfather.webp', 0, 1),
(2, 'Побег из Шоушенка', 3, 1994, 9.1, '/img/films/shawshank.webp', 0, 1),
(3, 'Темный рыцарь', 2, 2008, 9.0, '/img/films/blackknight.webp', 0, 1),
(4, 'Дюна', 4, 2021, 8.0, '/img/films/duna.webp', 1, 1),
(5, 'Не смотрите наверх', 5, 2021, 7.2, '/img/films/dontlookup.webp', 1, 0),
(6, 'Круэлла', 6, 2021, 7.3, '/img/films/cruella.webp', 1, 0);

INSERT INTO `genres` (`id`, `name`, `bio`, `icon`) VALUES
(1, 'Криминал', 'Фильмы, которые погружают зрителя в мир преступности, расследований и противостояния закона и беззакония, часто раскрывая психологию пре...', 'fa-film'),
(2, 'Драма', 'Фильмы, которые сосредоточены на развитии персонажей и эмоциональных темах, часто основанных на реальных событиях или глубоких человечес...', 'fa-theater-masks'),
(3, 'Боевик', 'Фильмы с динамичным сюжетом, наполненные экшн-сценами, перестрелками, погонями и физическими противостояниями, где герои проходят через и...', 'fa-running'),
(4, 'Фантастика', 'Фильмы, исследующие вымышленные миры, футуристические технологии, параллельные реальности или внеземные цивилизации, заставляя зрителя ...', 'fa-rocket'),
(5, 'Приключения', 'Фильмы, полные увлекательных путешествий, открытий и испытаний, где герои отправляются в неизведанные места, сталкиваются с опасностями и...', 'fa-map'),
(6, 'Комедия', 'Фильмы, основной целью которых является развлечение и вызов смеха у зрителя, используя юмор, сарказм, комичные ситуации и ярких персонажей...', 'fa-laugh-squint'),
(7, 'Триллер', 'Фильмы, которые держат зрителя в напряжении благодаря интригующему сюжету, непредсказуемым поворотам, психологическому давлению и посто...', 'fa-user-secret'),
(8, 'Военный', 'Фильмы, рассказывающие о военных конфликтах, подвигах солдат и тяготах жизни на войне, зачастую показывая исторические события и человече...', 'fa-tag');

INSERT INTO `film_genre` (`film_id`, `genre_id`) VALUES
(1, 1),
(3, 1),
(6, 1),
(1, 2),
(2, 2),
(3, 2),
(5, 2),
(3, 3),
(4, 4),
(4, 5),
(5, 6),
(6, 6);
SQL;

if ($mysqli->multi_query($sql)) {
    do {
        if ($result = $mysqli->store_result()) {
            $result->free();
        }
    } while ($mysqli->more_results() && $mysqli->next_result());

    if ($mysqli->errno) {
        http_response_code(500);
        echo "БД создавалась, но возникли ошибки: " . $mysqli->error . PHP_EOL;
    } else {
        echo "База данных `videoteka` и все таблицы успешно созданы/обновлены." . PHP_EOL;
    }
} else {
    http_response_code(500);
    echo "Ошибка при выполнении SQL: " . $mysqli->error . PHP_EOL;
}

$mysqli->close();
