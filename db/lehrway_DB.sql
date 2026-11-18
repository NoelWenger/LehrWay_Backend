-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 18. Nov 2026 um 10:43
-- Server-Version: 10.6.23-MariaDB-0ubuntu0.22.04.1
-- PHP-Version: 8.4.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `lehrway_DB`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `klasse`
--

CREATE TABLE `klasse` (
  `id` int(11) NOT NULL,
  `bezeichnung` varchar(50) DEFAULT NULL,
  `lehrgang_id` int(11) DEFAULT NULL,
  `notizen` text DEFAULT NULL,
  `anzahl_schultage_woche` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `klasse`
--

INSERT INTO `klasse` (`id`, `bezeichnung`, `lehrgang_id`, `notizen`, `anzahl_schultage_woche`) VALUES
(1, 'D24a', 1, '├£K kommt noch vor', 3),
(2, 'D23a', 1, 'Raumwechsel am Dienstag', 1),
(3, 'INA24a', 2, NULL, 2),
(4, 'INP25a', 3, 'Zwei Sch├╝ler wiederholen M117', 3);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `klasse_label`
--

CREATE TABLE `klasse_label` (
  `klasse_id` int(11) DEFAULT NULL,
  `label_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `klasse_label`
--

INSERT INTO `klasse_label` (`klasse_id`, `label_id`) VALUES
(1, 1),
(1, 4),
(2, 1),
(2, 3),
(3, 2),
(4, 3);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `klasse_modul`
--

CREATE TABLE `klasse_modul` (
  `id` int(11) NOT NULL,
  `bezeichnung` varchar(50) DEFAULT NULL,
  `lehrjahr` int(11) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `quartal` int(11) DEFAULT NULL,
  `lektionen` int(11) DEFAULT NULL,
  `klasse_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `klasse_modul`
--

INSERT INTO `klasse_modul` (`id`, `bezeichnung`, `lehrjahr`, `semester`, `quartal`, `lektionen`, `klasse_id`) VALUES
(1, 'M114 Codierungen', 1, 1, 1, 40, 1),
(2, 'M231 Datenschutz', 1, 1, 2, 20, 1),
(3, 'M104 Datenmodelle', 1, 2, 3, 60, 1),
(4, 'M293 Webauftritt', 1, 2, 4, 80, 1),
(5, 'M319 Applikationen entwerfen', 2, 1, 1, 80, 1),
(6, 'M426 Agile Methoden', 2, 2, 3, 40, 1),
(8, 'M114 Codierungen', 1, 1, 1, 40, 2),
(9, 'M231 Datenschutz', 1, 1, 2, 20, 2),
(10, 'M104 Datenmodelle', 1, 2, 3, 60, 2),
(11, 'M293 Webauftritt', 1, 2, 4, 80, 2),
(12, 'M319 Applikationen entwerfen', 2, 1, 1, 80, 2),
(13, 'M426 Agile Methoden', 2, 2, 3, 40, 2),
(15, 'M114 Codierungen', 1, 1, 1, 40, 3),
(16, 'M123 Server betreiben', 1, 2, 3, 60, 3),
(17, 'M431 Aufgaben selbstst├ñndig planen', 2, 1, 2, 20, 3),
(18, 'M347 Container', 2, 2, 4, 40, 3),
(22, 'M117 Netzwerk realisieren', 1, 1, 2, 60, 4),
(23, 'M129 LAN Komponenten', 1, 2, 3, 80, 4),
(24, 'M159 Verzeichnisdienst', 2, 1, 1, 60, 4);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `klasse_ressource`
--

CREATE TABLE `klasse_ressource` (
  `klasse_id` int(11) DEFAULT NULL,
  `ressourcen_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `klasse_ressource`
--

INSERT INTO `klasse_ressource` (`klasse_id`, `ressourcen_id`) VALUES
(1, 1),
(1, 3),
(2, 2),
(3, 2),
(3, 4),
(4, 3),
(4, 4),
(1, 5),
(4, 5);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `label`
--

CREATE TABLE `label` (
  `id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `label`
--

INSERT INTO `label` (`id`, `name`) VALUES
(4, '├£K vorhanden'),
(3, 'Basis-Lehrjahr'),
(1, 'IMS'),
(2, 'WayUp');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `lehrgang`
--

CREATE TABLE `lehrgang` (
  `id` int(11) NOT NULL,
  `bezeichnung` varchar(255) DEFAULT NULL,
  `semesteranzahl` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `lehrgang`
--

INSERT INTO `lehrgang` (`id`, `bezeichnung`, `semesteranzahl`) VALUES
(1, 'IMS', 6),
(2, 'Informatiker Applikationsentwicklung EFZ', 8),
(3, 'Informatiker Plattformentwicklung EFZ', 8);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `lehrgang_modul`
--

CREATE TABLE `lehrgang_modul` (
  `id` int(11) NOT NULL,
  `bezeichnung` varchar(50) DEFAULT NULL,
  `lehrjahr` int(11) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `quartal` int(11) DEFAULT NULL,
  `lektionen` int(11) DEFAULT NULL,
  `lehrgang_id` int(11) DEFAULT NULL,
  `quartal_span` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `lehrgang_modul`
--

INSERT INTO `lehrgang_modul` (`id`, `bezeichnung`, `lehrjahr`, `semester`, `quartal`, `lektionen`, `lehrgang_id`, `quartal_span`) VALUES
(1, 'M114 Codierungen', 1, 1, 1, 40, 1, 1),
(2, 'M231 Datenschutz', 1, 1, 2, 20, 1, 1),
(3, 'M104 Datenmodelle', 1, 2, 3, 60, 1, 1),
(4, 'M293 Webauftritt', 1, 2, 4, 80, 1, 1),
(5, 'M319 Applikationen entwerfen', 2, 1, 1, 80, 1, 1),
(6, 'M426 Agile Methoden', 2, 2, 3, 40, 1, 1),
(7, 'M114 Codierungen', 1, 1, 1, 40, 2, 1),
(8, 'M123 Server betreiben', 1, 2, 3, 60, 2, 1),
(9, 'M431 Aufgaben selbstst├ñndig planen', 2, 1, 2, 20, 2, 1),
(10, 'M347 Container', 2, 2, 4, 40, 2, 1),
(11, 'M117 Netzwerk realisieren', 1, 1, 2, 60, 3, 1),
(12, 'M129 LAN Komponenten', 1, 2, 3, 80, 3, 1),
(13, 'M159 Verzeichnisdienst', 2, 1, 1, 60, 3, 1);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `log`
--

CREATE TABLE `log` (
  `id` int(11) NOT NULL,
  `lehrgang_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `beschreibung` text DEFAULT NULL,
  `erstellt_am` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `log`
--

INSERT INTO `log` (`id`, `lehrgang_id`, `user_id`, `beschreibung`, `erstellt_am`) VALUES
(1, 1, 1, 'Klasse D24a erstellt', NULL),
(2, 1, 2, 'Klasse D23a erstellt', NULL),
(3, 2, 1, 'Klasse INA24a erstellt', NULL),
(4, 3, 2, 'Modul M117 Netzwerk realisieren zu INP25a hinzugef├╝gt', NULL);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `regel`
--

CREATE TABLE `regel` (
  `id` int(11) NOT NULL,
  `klasse_a_id` int(11) DEFAULT NULL,
  `klasse_b_id` int(11) DEFAULT NULL
) ;

--
-- Daten für Tabelle `regel`
--

INSERT INTO `regel` (`id`, `klasse_a_id`, `klasse_b_id`) VALUES
(3, 1, 2),
(1, 1, 3),
(2, 2, 4);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `ressourcen`
--

CREATE TABLE `ressourcen` (
  `id` int(11) NOT NULL,
  `wochentag` varchar(20) DEFAULT NULL,
  `anzahl_raeume` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `ressourcen`
--

INSERT INTO `ressourcen` (`id`, `wochentag`, `anzahl_raeume`) VALUES
(1, 'Montag', 8),
(2, 'Dienstag', 6),
(3, 'Mittwoch', 3),
(4, 'Donnerstag', 5),
(5, 'Freitag', 4);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `passwort_hash` varchar(255) DEFAULT NULL,
  `zuletzt_aktiv` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Daten für Tabelle `user`
--

INSERT INTO `user` (`id`, `username`, `email`, `passwort_hash`, `zuletzt_aktiv`) VALUES
(1, 'khalil', 'khalil@lehrway.ch', 'hash1', NULL),
(2, 'noel', 'noel@lehrway.ch', 'hash2', NULL),
(3, 'hello_world', 'hello_world@gmail.com', '$2b$10$itkjPoORnl2YOblzuYmEE.ZTg2GPlxE8aEOmXpE7l1aJD/UGwrhUa', '2026-11-04 10:28:50');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `klasse`
--
ALTER TABLE `klasse`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bezeichnung` (`bezeichnung`),
  ADD KEY `lehrgang_id` (`lehrgang_id`);

--
-- Indizes für die Tabelle `klasse_label`
--
ALTER TABLE `klasse_label`
  ADD KEY `klasse_id` (`klasse_id`),
  ADD KEY `label_id` (`label_id`);

--
-- Indizes für die Tabelle `klasse_modul`
--
ALTER TABLE `klasse_modul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `klasse_id` (`klasse_id`);

--
-- Indizes für die Tabelle `klasse_ressource`
--
ALTER TABLE `klasse_ressource`
  ADD KEY `klasse_id` (`klasse_id`),
  ADD KEY `ressourcen_id` (`ressourcen_id`);

--
-- Indizes für die Tabelle `label`
--
ALTER TABLE `label`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indizes für die Tabelle `lehrgang`
--
ALTER TABLE `lehrgang`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `lehrgang_modul`
--
ALTER TABLE `lehrgang_modul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lehrgang_id` (`lehrgang_id`);

--
-- Indizes für die Tabelle `log`
--
ALTER TABLE `log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lehrgang_id` (`lehrgang_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `regel`
--
ALTER TABLE `regel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `klasse_a_id` (`klasse_a_id`,`klasse_b_id`),
  ADD KEY `klasse_b_id` (`klasse_b_id`);

--
-- Indizes für die Tabelle `ressourcen`
--
ALTER TABLE `ressourcen`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `klasse`
--
ALTER TABLE `klasse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT für Tabelle `klasse_modul`
--
ALTER TABLE `klasse_modul`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT für Tabelle `label`
--
ALTER TABLE `label`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT für Tabelle `lehrgang`
--
ALTER TABLE `lehrgang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT für Tabelle `lehrgang_modul`
--
ALTER TABLE `lehrgang_modul`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT für Tabelle `log`
--
ALTER TABLE `log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT für Tabelle `regel`
--
ALTER TABLE `regel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `ressourcen`
--
ALTER TABLE `ressourcen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT für Tabelle `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `klasse`
--
ALTER TABLE `klasse`
  ADD CONSTRAINT `klasse_ibfk_1` FOREIGN KEY (`lehrgang_id`) REFERENCES `lehrgang` (`id`);

--
-- Constraints der Tabelle `klasse_label`
--
ALTER TABLE `klasse_label`
  ADD CONSTRAINT `klasse_label_ibfk_1` FOREIGN KEY (`klasse_id`) REFERENCES `klasse` (`id`),
  ADD CONSTRAINT `klasse_label_ibfk_2` FOREIGN KEY (`label_id`) REFERENCES `label` (`id`);

--
-- Constraints der Tabelle `klasse_modul`
--
ALTER TABLE `klasse_modul`
  ADD CONSTRAINT `klasse_modul_ibfk_1` FOREIGN KEY (`klasse_id`) REFERENCES `klasse` (`id`);

--
-- Constraints der Tabelle `klasse_ressource`
--
ALTER TABLE `klasse_ressource`
  ADD CONSTRAINT `klasse_ressource_ibfk_1` FOREIGN KEY (`klasse_id`) REFERENCES `klasse` (`id`),
  ADD CONSTRAINT `klasse_ressource_ibfk_2` FOREIGN KEY (`ressourcen_id`) REFERENCES `ressourcen` (`id`);

--
-- Constraints der Tabelle `lehrgang_modul`
--
ALTER TABLE `lehrgang_modul`
  ADD CONSTRAINT `lehrgang_modul_ibfk_1` FOREIGN KEY (`lehrgang_id`) REFERENCES `lehrgang` (`id`);

--
-- Constraints der Tabelle `log`
--
ALTER TABLE `log`
  ADD CONSTRAINT `log_ibfk_1` FOREIGN KEY (`lehrgang_id`) REFERENCES `lehrgang` (`id`),
  ADD CONSTRAINT `log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

--
-- Constraints der Tabelle `regel`
--
ALTER TABLE `regel`
  ADD CONSTRAINT `regel_ibfk_1` FOREIGN KEY (`klasse_a_id`) REFERENCES `klasse` (`id`),
  ADD CONSTRAINT `regel_ibfk_2` FOREIGN KEY (`klasse_b_id`) REFERENCES `klasse` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
