-- Schuljahre ergänzen

CREATE TABLE IF NOT EXISTS schuljahr (

                                         id INT AUTO_INCREMENT PRIMARY KEY,

<<<<<<< HEAD
                                         start_jahr INT NOT NULL UNIQUE,

                                         bezeichnung VARCHAR(20) NOT NULL

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

    COLLATE=utf8mb4_unicode_ci;

INSERT INTO schuljahr (start_jahr, bezeichnung)

VALUES (2026, '2026/27')

    ON DUPLICATE KEY UPDATE start_jahr = VALUES(start_jahr);


-- Klassen und Räume einem Schuljahr zuordnen

ALTER TABLE klasse

    ADD COLUMN IF NOT EXISTS schuljahr_id INT NULL;

ALTER TABLE ressourcen

    ADD COLUMN IF NOT EXISTS schuljahr_id INT NULL;

UPDATE klasse

SET schuljahr_id = (

    SELECT id FROM schuljahr WHERE start_jahr = 2026

)

WHERE schuljahr_id IS NULL;

UPDATE ressourcen

SET schuljahr_id = (

    SELECT id FROM schuljahr WHERE start_jahr = 2026

)

WHERE schuljahr_id IS NULL;

ALTER TABLE klasse

    MODIFY COLUMN schuljahr_id INT NOT NULL;

ALTER TABLE ressourcen

    MODIFY COLUMN schuljahr_id INT NOT NULL;


-- Gleicher Klassenname ist in unterschiedlichen Schuljahren erlaubt

ALTER TABLE klasse
=======
--
-- Table structure for table `klasse`
--
>>>>>>> 13315f07d7a4ebdc384322eed2f31a2b6322666e

    ADD UNIQUE INDEX IF NOT EXISTS

    uq_klasse_bezeichnung_schuljahr

    (bezeichnung, schuljahr_id);

-- Dieser alte Index ist in Lukas Export vorhanden.

ALTER TABLE klasse

DROP INDEX IF EXISTS bezeichnung;

<<<<<<< HEAD

-- Beziehungen zu Schuljahren ergänzen

ALTER TABLE klasse

    ADD FOREIGN KEY IF NOT EXISTS fk_klasse_schuljahr

    (schuljahr_id) REFERENCES schuljahr(id);

ALTER TABLE ressourcen

    ADD FOREIGN KEY IF NOT EXISTS fk_ressourcen_schuljahr

    (schuljahr_id) REFERENCES schuljahr(id);


-- Login-Sitzungen ergänzen
=======
--
-- Dumping data for table `klasse_modul`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `klasse_modul` WRITE;
/*!40000 ALTER TABLE `klasse_modul` DISABLE KEYS */;
INSERT INTO `klasse_modul` VALUES
(1,'M114 Codierungen',1,1,1,40,1),
(2,'M231 Datenschutz',1,1,2,20,1),
(3,'M104 Datenmodelle',1,2,3,60,1),
(4,'M293 Webauftritt',1,2,4,80,1),
(5,'M319 Applikationen entwerfen',2,1,1,80,1),
(6,'M426 Agile Methoden',2,2,3,40,1),
(8,'M114 Codierungen',1,1,1,40,2),
(9,'M231 Datenschutz',1,1,2,20,2),
(10,'M104 Datenmodelle',1,2,3,60,2),
(11,'M293 Webauftritt',1,2,4,80,2),
(12,'M319 Applikationen entwerfen',2,1,1,80,2),
(13,'M426 Agile Methoden',2,2,3,40,2),
(15,'M114 Codierungen',1,1,1,40,3),
(16,'M123 Server betreiben',1,2,3,60,3),
(17,'M431 Aufgaben selbstst├ñndig planen',2,1,2,20,3),
(18,'M347 Container',2,2,4,40,3),
(22,'M117 Netzwerk realisieren',1,1,2,60,4),
(23,'M129 LAN Komponenten',1,2,3,80,4),
(24,'M159 Verzeichnisdienst',2,1,1,60,4);
/*!40000 ALTER TABLE `klasse_modul` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
>>>>>>> 13315f07d7a4ebdc384322eed2f31a2b6322666e

CREATE TABLE IF NOT EXISTS app_session (

                                           token_hash CHAR(64) PRIMARY KEY,

    user_id INT NOT NULL,

    expires_at DATETIME NOT NULL,

    INDEX idx_app_session_expires_at (expires_at),

    CONSTRAINT fk_app_session_user

    FOREIGN KEY (user_id)

    REFERENCES `user`(id)

    ON DELETE CASCADE

    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4

    COLLATE=utf8mb4_unicode_ci;


-- Labelfarben ergänzen

ALTER TABLE label

    ADD COLUMN IF NOT EXISTS

    farbe VARCHAR(7) NOT NULL DEFAULT '#0d6efd';

ALTER TABLE klasse_label

    ADD COLUMN IF NOT EXISTS

    farbe VARCHAR(7) NOT NULL DEFAULT '#0d6efd';


-- Quartalslänge sicherstellen

ALTER TABLE lehrgang_modul

    ADD COLUMN IF NOT EXISTS

    quartal_span INT NOT NULL DEFAULT 1;


-- Änderungsprotokoll erweitern

ALTER TABLE log

    ADD COLUMN IF NOT EXISTS

    benutzername VARCHAR(50) NULL,

<<<<<<< HEAD
    ADD COLUMN IF NOT EXISTS
=======
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `passwort_hash` varchar(255) DEFAULT NULL,
  `zuletzt_aktiv` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
>>>>>>> 13315f07d7a4ebdc384322eed2f31a2b6322666e

    aktion VARCHAR(80) NULL,

<<<<<<< HEAD
    ADD COLUMN IF NOT EXISTS
=======
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES
(1,'khalil','khalil@lehrway.ch','hash1',NULL),
(2,'noel','noel@lehrway.ch','hash2',NULL),
(3,'hello_world','hello_world@gmail.com','$2b$10$itkjPoORnl2YOblzuYmEE.ZTg2GPlxE8aEOmXpE7l1aJD/UGwrhUa','2026-11-04 10:28:50'),
(4,'lol','lol@lol.lol','$2b$10$iYKMzib97brBNJQXzAafAOL5tJKWeWWWpCgxxTpz.sFKXFvdWTNci','2026-11-11 09:51:01');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
>>>>>>> 13315f07d7a4ebdc384322eed2f31a2b6322666e

    objekt_typ VARCHAR(50) NULL,

<<<<<<< HEAD
    ADD COLUMN IF NOT EXISTS

    objekt_id INT NULL,

    ADD COLUMN IF NOT EXISTS

    vorher_json LONGTEXT NULL,

    ADD COLUMN IF NOT EXISTS

    nachher_json LONGTEXT NULL;

ALTER TABLE log

    MODIFY COLUMN erstellt_am

    TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP;


-- Ergebnis kontrollieren

SHOW TABLES;
 
SHOW COLUMNS FROM klasse LIKE 'schuljahr_id';

SHOW COLUMNS FROM ressourcen LIKE 'schuljahr_id';

SHOW COLUMNS FROM label LIKE 'farbe';

SHOW COLUMNS FROM log;
 
=======
-- Dump completed on 2026-11-18  9:35:07
>>>>>>> 13315f07d7a4ebdc384322eed2f31a2b6322666e
