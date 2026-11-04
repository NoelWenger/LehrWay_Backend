
USE lehrway;

DROP TABLE IF EXISTS log;
DROP TABLE IF EXISTS klasse_ressource;
DROP TABLE IF EXISTS regel;
DROP TABLE IF EXISTS klasse_label;
DROP TABLE IF EXISTS klasse_modul;
DROP TABLE IF EXISTS ressourcen;
DROP TABLE IF EXISTS klasse;
DROP TABLE IF EXISTS label;
DROP TABLE IF EXISTS lehrgang_modul;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS schuljahr;
DROP TABLE IF EXISTS lehrgang;

CREATE TABLE lehrgang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(255),
    semesteranzahl INT
);

CREATE TABLE schuljahr (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_jahr INT NOT NULL UNIQUE,
    bezeichnung VARCHAR(20) NOT NULL
);

CREATE TABLE lehrgang_modul (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50),
    lehrjahr INT,
    semester INT,
    quartal INT,
    lektionen INT,
    lehrgang_id INT,
    quartal_span INT NOT NULL DEFAULT 1,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id)
);

CREATE TABLE klasse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50),
    lehrgang_id INT,
    notizen TEXT,
    anzahl_schultage_woche INT,
    schuljahr_id INT NOT NULL,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id),
    FOREIGN KEY (schuljahr_id) REFERENCES schuljahr(id),
    UNIQUE (bezeichnung, schuljahr_id)
);

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

CREATE TABLE label (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farbe VARCHAR(7) NOT NULL DEFAULT '#0d6efd',
    name VARCHAR(50) UNIQUE
);

CREATE TABLE klasse_label (
    klasse_id INT,
    label_id INT,
    farbe VARCHAR(7) NOT NULL DEFAULT '#0d6efd',
    FOREIGN KEY (klasse_id) REFERENCES klasse(id),
    FOREIGN KEY (label_id) REFERENCES label(id)
);

CREATE TABLE regel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    klasse_a_id INT,
    klasse_b_id INT,
    FOREIGN KEY (klasse_a_id) REFERENCES klasse(id),
    FOREIGN KEY (klasse_b_id) REFERENCES klasse(id),
    UNIQUE (klasse_a_id, klasse_b_id),
    CHECK (klasse_a_id != klasse_b_id)
);

CREATE TABLE ressourcen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wochentag VARCHAR(20),
    anzahl_raeume INT,
    schuljahr_id INT NOT NULL,
    FOREIGN KEY (schuljahr_id) REFERENCES schuljahr(id)
);

CREATE TABLE klasse_ressource (
    klasse_id INT,
    ressourcen_id INT,
    FOREIGN KEY (klasse_id) REFERENCES klasse(id),
    FOREIGN KEY (ressourcen_id) REFERENCES ressourcen(id)
);

CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    passwort_hash VARCHAR(255),
    zuletzt_aktiv TIMESTAMP
);

CREATE TABLE log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lehrgang_id INT,
    user_id INT,
    beschreibung TEXT,
    erstellt_am TIMESTAMP,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

INSERT INTO schuljahr (start_jahr, bezeichnung)
VALUES (2026, '2026/27');
