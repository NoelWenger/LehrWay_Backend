# Lehrway – Backend & Datenbank

Lehrway ist eine Webanwendung zur Planung und Verwaltung von Lehrgängen, Modulen und Klassen. Dieses Repository umfasst den **Backend- beziehungsweise Datenbankteil** des Projekts. Ziel ist es, die Daten für die Wochenübersicht, Lehrgangsplanung und Klassenverwaltung strukturiert bereitzustellen.

> **Entwicklungsstand:** Der vorliegende Code beschreibt die MySQL-Datenbank (DDL) und ihre Beispieldaten (DML). Die Datenbankabfragen (DQL) sind noch in Bearbeitung. Ein implementierter API-Server wurde für diese Dokumentation nicht bereitgestellt.

## Projektteam

- Luka
- Noel
- Khalil
- Kenan



## Technologie

- **MySQL:** relationales Datenbanksystem
- **SQL:** DDL zum Erstellen der Struktur und DML zum Einfügen von Testdaten

## Datenbankaufbau

Die Datenbank heisst `lehrway` und enthält elf Tabellen:

| Tabelle | Aufgabe |
| --- | --- |
| `lehrgang` | Lehrgänge mit Bezeichnung und Semesteranzahl speichern |
| `lehrgang_modul` | Module eines Lehrgangs samt zeitlicher Einteilung und Lektionen erfassen |
| `klasse` | Klassen einem Lehrgang zuordnen und Notizen sowie Schultage speichern |
| `klasse_modul` | Individuelle Moduldaten einer Klasse verwalten |
| `label` | Verfügbare Labels definieren |
| `klasse_label` | Klassen und Labels miteinander verknüpfen |
| `regel` | Klassenpaare erfassen, die gemäss Planung nicht am selben Tag stattfinden sollen |
| `ressourcen` | Anzahl verfügbarer Räume pro Wochentag speichern |
| `klasse_ressource` | Klassen den jeweiligen Wochentags-Ressourcen zuordnen |
| `user` | Benutzernamen, E-Mail-Adressen und Passwort-Hashes speichern |
| `log` | Aktionen mit Bezug zu Lehrgang und Benutzer protokollieren |

### Beziehungen

- Ein **Lehrgang** kann mehrere Lehrgangsmodule und mehrere Klassen besitzen.
- Eine **Klasse** gehört über `lehrgang_id` zu einem Lehrgang und kann mehrere eigene Klassenmodule besitzen.
- **Klassen und Labels** sind über `klasse_label` miteinander verbunden (n:m).
- **Klassen und Ressourcen** sind über `klasse_ressource` miteinander verbunden (n:m).
- Eine **Regel** verweist auf zwei verschiedene Klassen (`klasse_a_id`, `klasse_b_id`).
- Ein **Logeintrag** verweist auf einen Lehrgang und einen Benutzer.

Die Beziehungen werden durch Fremdschlüssel abgesichert. Eindeutige Werte sind unter anderem für Klassennamen, Labelnamen, Benutzernamen und E-Mail-Adressen vorgesehen.

## Entity-Relationship-Modell (ERM)

Das **Entity-Relationship-Modell (ERM)** dokumentiert die Datenbankstruktur grafisch und ergänzt die Tabellen- und Beziehungsbeschreibungen dieser README.

📄 **[ERM-Diagramm ansehen](docs/ERM_Diagramm_3Edition.pdf)**


## Zentrale Funktionen der Datenbank

### Lehrgänge und Module

Ein Lehrgang besitzt eine Bezeichnung und eine Anzahl Semester. Die zugehörigen Module enthalten Lehrjahr, Semester, Quartal und Lektionen. Dadurch können verschiedene Ausbildungsgänge mit eigenen Lehrplänen erfasst werden.

### Klassen und individuelle Lehrpläne

Jede Klasse ist einem Lehrgang zugeordnet. Ihre Module werden in `klasse_modul` separat gespeichert. Das erlaubt grundsätzlich, den Modulplan einer Klasse unabhängig von der ursprünglichen Lehrgangsvorlage anzupassen. Beim Einfügen der Beispieldaten werden die Lehrgangsmodule zunächst in die jeweiligen Klassenmodule kopiert.

### Labels

Labels dienen zur Kennzeichnung von Klassen, beispielsweise nach Ausbildungsweg oder besonderen Merkmalen. Eine Klasse kann mehrere Labels besitzen, und ein Label kann mehreren Klassen zugeordnet sein.

### Regeln und Raumplanung

In `regel` werden Klassenpaare gespeichert, die bei der Wochenplanung nicht am selben Tag eingeplant werden sollen. `ressourcen` enthält die Raumkapazität je Wochentag. Die Tabelle `klasse_ressource` ordnet Klassen den betreffenden Wochentagen zu.

**Wichtig:** Die Tabellen speichern Regeln und Zuordnungen. Eine automatische Konfliktprüfung oder Durchsetzung der Planungsregeln ist durch das vorliegende SQL allein noch nicht nachgewiesen und muss in Abfragen beziehungsweise Backend-Logik umgesetzt werden. Nach der Finalisierung von DQL wird diese Nachricht gelöscht.

### Benutzer und Protokollierung

Die Tabelle `user` sieht Benutzernamen, eindeutige E-Mail-Adressen, Passwort-Hashes und einen Zeitstempel für die letzte Aktivität vor. `log` ermöglicht das Speichern von Beschreibungen einzelner Aktionen mit Benutzer- und Lehrgangsbezug.




## Aktueller Entwicklungsstand

| Bereich | Status |
| --- | --- |
| Datenbankstruktur (DDL) | Vorhanden |
| Beispieldaten (DML) | Vorhanden |
| Datenbankabfragen (DQL) | In Bearbeitung |

## Mögliche nächste Schritte

1. DQL-Abfragen für Lehrgänge, Klassen, Module, Labels, Räume und Regeln ausarbeiten.
2. Eine Backend-API entwickeln, über die das Frontend Daten lesen und verändern kann.
3. Registrierung und Login mit sicherem Passwort-Hashing und geeigneter Authentifizierung umsetzen.
4. Konfliktprüfungen für Klassenregeln und Raumkapazitäten ergänzen.
5. Eingaben validieren, Fehlerfälle behandeln und Zugriffsrechte definieren.
6. Tests für Datenbankzugriffe und die Schnittstelle zum Frontend erstellen.

## Verbindung zum Frontend

Das separate Lehrway-Frontend stellt unter anderem eine Wochenübersicht, Klassenverwaltung und Lehrgangsplanung bereit. Die Datenbank soll die dafür benötigten Informationen dauerhaft speichern. Die konkrete API-Struktur, die Servertechnologie und die Verbindungs-Konfiguration werden dokumentiert, sobald der entsprechende Backend-Code vorliegt.


