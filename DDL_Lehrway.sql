CREATE DATABASE lehrway;
USE lehrway;

CREATE TABLE lehrgang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(255) UNIQUE,
    semesteranzahl INT
);

CREATE TABLE klasse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50) UNIQUE,
    notizen TEXT,
    semester VARCHAR(50),
    anzahl_schultage_woche INT,
    lehrgang_id INT,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id)
);

CREATE TABLE klasse_wochentag (
    klasse_id INT,
    wochentag VARCHAR(20),
    FOREIGN KEY (klasse_id) REFERENCES klasse(id)
);

CREATE TABLE modul (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bezeichnung VARCHAR(50),
    semester INT,
    lehrgang_id INT,
    FOREIGN KEY (lehrgang_id) REFERENCES lehrgang(id)
);

CREATE TABLE label (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

CREATE TABLE klasse_label (
    klasse_id INT,
    label_id INT,
    FOREIGN KEY (klasse_id) REFERENCES klasse(id),
    FOREIGN KEY (label_id) REFERENCES label(id)
);

CREATE TABLE schultag (
    id INT AUTO_INCREMENT PRIMARY KEY,
    klasse_id INT,
    datum DATE,
    FOREIGN KEY (klasse_id) REFERENCES klasse(id)
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

CREATE TABLE einstellung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anzahl_raeume INT
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