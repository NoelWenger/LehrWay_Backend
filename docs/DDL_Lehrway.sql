DROP DATABASE IF EXISTS lehrway;
CREATE DATABASE lehrway;
USE lehrway;

DROP TABLE IF EXISTS lehrgang;
CREATE TABLE lehrgang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(255),
    semesteranzahl INT
);

DROP TABLE IF EXISTS lehrgang_modul;
CREATE TABLE lehrgang_modul (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50),
    lehrjahr INT,
    semester INT,
    quartal INT,
    lektionen INT,
    lehrgang_id INT,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id)
);

DROP TABLE IF EXISTS klasse;
CREATE TABLE klasse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50) UNIQUE,
    lehrgang_id INT,
    notizen TEXT,
    anzahl_schultage_woche INT,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id)
);

DROP TABLE IF EXISTS klasse_modul;
CREATE TABLE klasse_modul (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50),
    lehrjahr INT,
    semester INT,
    quartal INT,
    lektionen INT,
    klasse_id INT,
    FOREIGN KEY (klasse_id) REFERENCES klasse(id)
);

DROP TABLE IF EXISTS label;
CREATE TABLE label (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

DROP TABLE IF EXISTS klasse_label;
CREATE TABLE klasse_label (
    klasse_id INT,
    label_id INT,
    FOREIGN KEY (klasse_id) REFERENCES klasse(id),
    FOREIGN KEY (label_id) REFERENCES label(id)
);

DROP TABLE IF EXISTS regel;
CREATE TABLE regel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    klasse_a_id INT,
    klasse_b_id INT,
    FOREIGN KEY (klasse_a_id) REFERENCES klasse(id),
    FOREIGN KEY (klasse_b_id) REFERENCES klasse(id),
    UNIQUE (klasse_a_id, klasse_b_id),
    CHECK (klasse_a_id != klasse_b_id)
);

DROP TABLE IF EXISTS ressourcen;
CREATE TABLE ressourcen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wochentag VARCHAR(20),
    anzahl_raeume INT
);

DROP TABLE IF EXISTS klasse_ressource;
CREATE TABLE klasse_ressource (
    klasse_id INT,
    ressourcen_id INT,
    FOREIGN KEY (klasse_id) REFERENCES klasse(id),
    FOREIGN KEY (ressourcen_id) REFERENCES ressourcen(id)
);

DROP TABLE IF EXISTS user;
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    passwort_hash VARCHAR(255),
    zuletzt_aktiv TIMESTAMP
);

DROP TABLE IF EXISTS log;
CREATE TABLE log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lehrgang_id INT,
    user_id INT,
    beschreibung TEXT,
    erstellt_am TIMESTAMP,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);