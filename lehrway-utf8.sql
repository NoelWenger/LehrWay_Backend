-- Schuljahre ergänzen

CREATE TABLE IF NOT EXISTS schuljahr (

                                         id INT AUTO_INCREMENT PRIMARY KEY,

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

    ADD UNIQUE INDEX IF NOT EXISTS

    uq_klasse_bezeichnung_schuljahr

    (bezeichnung, schuljahr_id);

-- Dieser alte Index ist in Lukas Export vorhanden.

ALTER TABLE klasse

DROP INDEX IF EXISTS bezeichnung;


-- Beziehungen zu Schuljahren ergänzen

ALTER TABLE klasse

    ADD FOREIGN KEY IF NOT EXISTS fk_klasse_schuljahr

    (schuljahr_id) REFERENCES schuljahr(id);

ALTER TABLE ressourcen

    ADD FOREIGN KEY IF NOT EXISTS fk_ressourcen_schuljahr

    (schuljahr_id) REFERENCES schuljahr(id);


-- Login-Sitzungen ergänzen

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

    ADD COLUMN IF NOT EXISTS

    aktion VARCHAR(80) NULL,

    ADD COLUMN IF NOT EXISTS

    objekt_typ VARCHAR(50) NULL,

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
 