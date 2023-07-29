CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    type TEXT,
    room TEXT,
    "start" TEXT,
    "end" TEXT,
    language TEXT,
    title TEXT,
    description TEXT,
    co_write TEXT,
    qa TEXT,
    slide TEXT,
    record TEXT,
    uri TEXT
);

CREATE TABLE speakers (
    id TEXT PRIMARY KEY,
    avatar TEXT,
    name TEXT,
    bio TEXT
);

CREATE TABLE session_types (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT
);

CREATE TABLE rooms (
    id TEXT PRIMARY KEY,
    name TEXT
);

CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT
);

