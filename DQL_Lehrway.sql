SELECT * FROM lehrgang;

SELECT klasse.bezeichnung, lehrgang.bezeichnung AS lehrgang
FROM klasse
INNER JOIN lehrgang ON klasse.lehrgang_id = lehrgang.id;

SELECT klasse_modul.bezeichnung, klasse_modul.lehrjahr, klasse_modul.semester, klasse_modul.quartal, klasse_modul.lektionen
FROM klasse_modul
INNER JOIN klasse ON klasse_modul.klasse_id = klasse.id
WHERE klasse.bezeichnung = 'D24a';

SELECT klasse.bezeichnung AS klasse, label.name AS label
FROM klasse_label
INNER JOIN klasse ON klasse_label.klasse_id = klasse.id
INNER JOIN label ON klasse_label.label_id = label.id;

SELECT klasse.bezeichnung AS klasse, ressourcen.wochentag
FROM klasse_ressource
INNER JOIN klasse ON klasse_ressource.klasse_id = klasse.id
INNER JOIN ressourcen ON klasse_ressource.ressourcen_id = ressourcen.id;

SELECT ressourcen.wochentag, COUNT(klasse_ressource.klasse_id) AS anzahl_klassen, ressourcen.anzahl_raeume
FROM ressourcen
INNER JOIN klasse_ressource ON klasse_ressource.ressourcen_id = ressourcen.id
GROUP BY ressourcen.id, ressourcen.wochentag, ressourcen.anzahl_raeume;

SELECT ressourcen.wochentag, COUNT(klasse_ressource.klasse_id) AS anzahl_klassen, ressourcen.anzahl_raeume
FROM ressourcen
INNER JOIN klasse_ressource ON klasse_ressource.ressourcen_id = ressourcen.id
GROUP BY ressourcen.id, ressourcen.wochentag, ressourcen.anzahl_raeume
HAVING COUNT(klasse_ressource.klasse_id) > ressourcen.anzahl_raeume;

SELECT regel.id, klasse_a.bezeichnung AS klasse_a, klasse_b.bezeichnung AS klasse_b
FROM regel
INNER JOIN klasse AS klasse_a ON regel.klasse_a_id = klasse_a.id
INNER JOIN klasse AS klasse_b ON regel.klasse_b_id = klasse_b.id;

SELECT regel.id, ressourcen.wochentag
FROM regel
INNER JOIN klasse_ressource AS wochentage_klasse_a ON wochentage_klasse_a.klasse_id = regel.klasse_a_id
INNER JOIN klasse_ressource AS wochentage_klasse_b ON wochentage_klasse_b.klasse_id = regel.klasse_b_id AND wochentage_klasse_b.ressourcen_id = wochentage_klasse_a.ressourcen_id
INNER JOIN ressourcen ON ressourcen.id = wochentage_klasse_a.ressourcen_id;

SELECT klasse.bezeichnung, SUM(klasse_modul.lektionen) AS lektionen_total
FROM klasse
INNER JOIN klasse_modul ON klasse_modul.klasse_id = klasse.id
GROUP BY klasse.id, klasse.bezeichnung;

SELECT user.username, log.beschreibung
FROM log
INNER JOIN user ON log.user_id = user.id;