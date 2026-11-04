USE lehrway;

INSERT INTO lehrgang (bezeichnung, semesteranzahl) VALUES
('IMS', 6),
('Informatiker Applikationsentwicklung EFZ', 8),
('Informatiker Plattformentwicklung EFZ', 8);

INSERT INTO lehrgang_modul (bezeichnung, lehrjahr, semester, quartal, lektionen, lehrgang_id) VALUES
('M114 Codierungen', 1, 1, 1, 40, 1),
('M231 Datenschutz', 1, 1, 2, 20, 1),
('M104 Datenmodelle', 1, 2, 3, 60, 1),
('M293 Webauftritt', 1, 2, 4, 80, 1),
('M319 Applikationen entwerfen', 2, 1, 1, 80, 1),
('M426 Agile Methoden', 2, 2, 3, 40, 1),
('M114 Codierungen', 1, 1, 1, 40, 2),
('M123 Server betreiben', 1, 2, 3, 60, 2),
('M431 Aufgaben selbstständig planen', 2, 1, 2, 20, 2),
('M347 Container', 2, 2, 4, 40, 2),
('M117 Netzwerk realisieren', 1, 1, 2, 60, 3),
('M129 LAN Komponenten', 1, 2, 3, 80, 3),
('M159 Verzeichnisdienst', 2, 1, 1, 60, 3);

INSERT INTO klasse (bezeichnung, lehrgang_id, notizen, anzahl_schultage_woche) VALUES
('D24a', 1, 'ÜK kommt noch vor', 2),
('D23a', 1, 'Raumwechsel am Dienstag', 2),
('INA24a', 2, NULL, 2),
('INP25a', 3, 'Zwei Schüler wiederholen M117', 2);

INSERT INTO klasse_modul (bezeichnung, lehrjahr, semester, quartal, lektionen, klasse_id)
SELECT bezeichnung, lehrjahr, semester, quartal, lektionen, 1 FROM lehrgang_modul WHERE lehrgang_id = 1;

INSERT INTO klasse_modul (bezeichnung, lehrjahr, semester, quartal, lektionen, klasse_id)
SELECT bezeichnung, lehrjahr, semester, quartal, lektionen, 2 FROM lehrgang_modul WHERE lehrgang_id = 1;

INSERT INTO klasse_modul (bezeichnung, lehrjahr, semester, quartal, lektionen, klasse_id)
SELECT bezeichnung, lehrjahr, semester, quartal, lektionen, 3 FROM lehrgang_modul WHERE lehrgang_id = 2;

INSERT INTO klasse_modul (bezeichnung, lehrjahr, semester, quartal, lektionen, klasse_id)
SELECT bezeichnung, lehrjahr, semester, quartal, lektionen, 4 FROM lehrgang_modul WHERE lehrgang_id = 3;

INSERT INTO label (name) VALUES
('IMS'),
('WayUp'),
('Basis-Lehrjahr'),
('ÜK vorhanden');

INSERT INTO klasse_label (klasse_id, label_id) VALUES
(1, 1),
(1, 4),
(2, 1),
(2, 3),
(3, 2),
(4, 3);

INSERT INTO ressourcen (wochentag, anzahl_raeume) VALUES
('Montag', 8),
('Dienstag', 6),
('Mittwoch', 8),
('Donnerstag', 5),
('Freitag', 4);

INSERT INTO klasse_ressource (klasse_id, ressourcen_id) VALUES
(1, 1),
(1, 3),
(2, 1),
(2, 2),
(3, 2),
(3, 4),
(4, 3),
(4, 5);

INSERT INTO regel (klasse_a_id, klasse_b_id) VALUES
(1, 3),
(2, 4);

INSERT INTO user (username, email, passwort_hash) VALUES
('khalil', 'khalil@lehrway.ch', 'hash1'),
('noel', 'noel@lehrway.ch', 'hash2');

INSERT INTO log (lehrgang_id, user_id, beschreibung) VALUES
(1, 1, 'Klasse D24a erstellt'),
(1, 2, 'Klasse D23a erstellt'),
(2, 1, 'Klasse INA24a erstellt'),
(3, 2, 'Modul M117 Netzwerk realisieren zu INP25a hinzugefügt');