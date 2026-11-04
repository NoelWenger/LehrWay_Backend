/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-11.8.9-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: lehrway
-- ------------------------------------------------------
-- Server version	11.8.9-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `lehrway`
--

USE `lehrway_DB`;





--
-- Table structure for table `klasse`
--

DROP TABLE IF EXISTS `klasse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `klasse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bezeichnung` varchar(50) DEFAULT NULL,
  `lehrgang_id` int(11) DEFAULT NULL,
  `notizen` text DEFAULT NULL,
  `anzahl_schultage_woche` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bezeichnung` (`bezeichnung`),
  KEY `lehrgang_id` (`lehrgang_id`),
  CONSTRAINT `klasse_ibfk_1` FOREIGN KEY (`lehrgang_id`) REFERENCES `lehrgang` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `klasse`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `klasse` WRITE;
/*!40000 ALTER TABLE `klasse` DISABLE KEYS */;
INSERT INTO `klasse` VALUES
(1,'D24a',1,'├£K kommt noch vor',3),
(2,'D23a',1,'Raumwechsel am Dienstag',1),
(3,'INA24a',2,NULL,2),
(4,'INP25a',3,'Zwei Sch├╝ler wiederholen M117',3);
/*!40000 ALTER TABLE `klasse` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `klasse_label`
--

DROP TABLE IF EXISTS `klasse_label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `klasse_label` (
  `klasse_id` int(11) DEFAULT NULL,
  `label_id` int(11) DEFAULT NULL,
  KEY `klasse_id` (`klasse_id`),
  KEY `label_id` (`label_id`),
  CONSTRAINT `klasse_label_ibfk_1` FOREIGN KEY (`klasse_id`) REFERENCES `klasse` (`id`),
  CONSTRAINT `klasse_label_ibfk_2` FOREIGN KEY (`label_id`) REFERENCES `label` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `klasse_label`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `klasse_label` WRITE;
/*!40000 ALTER TABLE `klasse_label` DISABLE KEYS */;
INSERT INTO `klasse_label` VALUES
(1,1),
(1,4),
(2,1),
(2,3),
(3,2),
(4,3);
/*!40000 ALTER TABLE `klasse_label` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `klasse_modul`
--

DROP TABLE IF EXISTS `klasse_modul`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `klasse_modul` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bezeichnung` varchar(50) DEFAULT NULL,
  `lehrjahr` int(11) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `quartal` int(11) DEFAULT NULL,
  `lektionen` int(11) DEFAULT NULL,
  `klasse_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `klasse_id` (`klasse_id`),
  CONSTRAINT `klasse_modul_ibfk_1` FOREIGN KEY (`klasse_id`) REFERENCES `klasse` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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

--
-- Table structure for table `klasse_ressource`
--

DROP TABLE IF EXISTS `klasse_ressource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `klasse_ressource` (
  `klasse_id` int(11) DEFAULT NULL,
  `ressourcen_id` int(11) DEFAULT NULL,
  KEY `klasse_id` (`klasse_id`),
  KEY `ressourcen_id` (`ressourcen_id`),
  CONSTRAINT `klasse_ressource_ibfk_1` FOREIGN KEY (`klasse_id`) REFERENCES `klasse` (`id`),
  CONSTRAINT `klasse_ressource_ibfk_2` FOREIGN KEY (`ressourcen_id`) REFERENCES `ressourcen` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `klasse_ressource`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `klasse_ressource` WRITE;
/*!40000 ALTER TABLE `klasse_ressource` DISABLE KEYS */;
INSERT INTO `klasse_ressource` VALUES
(1,1),
(1,3),
(2,2),
(3,2),
(3,4),
(4,3),
(4,4),
(1,5),
(4,5);
/*!40000 ALTER TABLE `klasse_ressource` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `label`
--

DROP TABLE IF EXISTS `label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `label` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `label`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `label` WRITE;
/*!40000 ALTER TABLE `label` DISABLE KEYS */;
INSERT INTO `label` VALUES
(3,'Basis-Lehrjahr'),
(1,'IMS'),
(4,'├£K vorhanden'),
(2,'WayUp');
/*!40000 ALTER TABLE `label` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `lehrgang`
--

DROP TABLE IF EXISTS `lehrgang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lehrgang` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bezeichnung` varchar(255) DEFAULT NULL,
  `semesteranzahl` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lehrgang`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `lehrgang` WRITE;
/*!40000 ALTER TABLE `lehrgang` DISABLE KEYS */;
INSERT INTO `lehrgang` VALUES
(1,'IMS',6),
(2,'Informatiker Applikationsentwicklung EFZ',8),
(3,'Informatiker Plattformentwicklung EFZ',8);
/*!40000 ALTER TABLE `lehrgang` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `lehrgang_modul`
--

DROP TABLE IF EXISTS `lehrgang_modul`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lehrgang_modul` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bezeichnung` varchar(50) DEFAULT NULL,
  `lehrjahr` int(11) DEFAULT NULL,
  `semester` int(11) DEFAULT NULL,
  `quartal` int(11) DEFAULT NULL,
  `lektionen` int(11) DEFAULT NULL,
  `lehrgang_id` int(11) DEFAULT NULL,
  `quartal_span` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `lehrgang_id` (`lehrgang_id`),
  CONSTRAINT `lehrgang_modul_ibfk_1` FOREIGN KEY (`lehrgang_id`) REFERENCES `lehrgang` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lehrgang_modul`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `lehrgang_modul` WRITE;
/*!40000 ALTER TABLE `lehrgang_modul` DISABLE KEYS */;
INSERT INTO `lehrgang_modul` VALUES
(1,'M114 Codierungen',1,1,1,40,1,1),
(2,'M231 Datenschutz',1,1,2,20,1,1),
(3,'M104 Datenmodelle',1,2,3,60,1,1),
(4,'M293 Webauftritt',1,2,4,80,1,1),
(5,'M319 Applikationen entwerfen',2,1,1,80,1,1),
(6,'M426 Agile Methoden',2,2,3,40,1,1),
(7,'M114 Codierungen',1,1,1,40,2,1),
(8,'M123 Server betreiben',1,2,3,60,2,1),
(9,'M431 Aufgaben selbstst├ñndig planen',2,1,2,20,2,1),
(10,'M347 Container',2,2,4,40,2,1),
(11,'M117 Netzwerk realisieren',1,1,2,60,3,1),
(12,'M129 LAN Komponenten',1,2,3,80,3,1),
(13,'M159 Verzeichnisdienst',2,1,1,60,3,1);
/*!40000 ALTER TABLE `lehrgang_modul` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `log`
--

DROP TABLE IF EXISTS `log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lehrgang_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `beschreibung` text DEFAULT NULL,
  `erstellt_am` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lehrgang_id` (`lehrgang_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `log_ibfk_1` FOREIGN KEY (`lehrgang_id`) REFERENCES `lehrgang` (`id`),
  CONSTRAINT `log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `log` WRITE;
/*!40000 ALTER TABLE `log` DISABLE KEYS */;
INSERT INTO `log` VALUES
(1,1,1,'Klasse D24a erstellt',NULL),
(2,1,2,'Klasse D23a erstellt',NULL),
(3,2,1,'Klasse INA24a erstellt',NULL),
(4,3,2,'Modul M117 Netzwerk realisieren zu INP25a hinzugef├╝gt',NULL);
/*!40000 ALTER TABLE `log` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `regel`
--

DROP TABLE IF EXISTS `regel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `regel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `klasse_a_id` int(11) DEFAULT NULL,
  `klasse_b_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `klasse_a_id` (`klasse_a_id`,`klasse_b_id`),
  KEY `klasse_b_id` (`klasse_b_id`),
  CONSTRAINT `regel_ibfk_1` FOREIGN KEY (`klasse_a_id`) REFERENCES `klasse` (`id`),
  CONSTRAINT `regel_ibfk_2` FOREIGN KEY (`klasse_b_id`) REFERENCES `klasse` (`id`),
  CONSTRAINT `CONSTRAINT_1` CHECK (`klasse_a_id` <> `klasse_b_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regel`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `regel` WRITE;
/*!40000 ALTER TABLE `regel` DISABLE KEYS */;
INSERT INTO `regel` VALUES
(3,1,2),
(1,1,3),
(2,2,4);
/*!40000 ALTER TABLE `regel` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `ressourcen`
--

DROP TABLE IF EXISTS `ressourcen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ressourcen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wochentag` varchar(20) DEFAULT NULL,
  `anzahl_raeume` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ressourcen`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `ressourcen` WRITE;
/*!40000 ALTER TABLE `ressourcen` DISABLE KEYS */;
INSERT INTO `ressourcen` VALUES
(1,'Montag',8),
(2,'Dienstag',6),
(3,'Mittwoch',3),
(4,'Donnerstag',5),
(5,'Freitag',4);
/*!40000 ALTER TABLE `ressourcen` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES
(1,'khalil','khalil@lehrway.ch','hash1',NULL),
(2,'noel','noel@lehrway.ch','hash2',NULL),
(3,'hello_world','hello_world@gmail.com','$2b$10$itkjPoORnl2YOblzuYmEE.ZTg2GPlxE8aEOmXpE7l1aJD/UGwrhUa','2026-11-04 10:28:50');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-11-04 11:38:25
