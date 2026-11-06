CREATE TABLE IF NOT EXISTS tournaments (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming','live','completed')),
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS teams (
 id TEXT PRIMARY KEY,
 tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 kills INTEGER NOT NULL DEFAULT 0 CHECK(kills>=0),
 placement_points INTEGER NOT NULL DEFAULT 0 CHECK(placement_points>=0)
);
CREATE INDEX IF NOT EXISTS teams_tournament ON teams(tournament_id);
