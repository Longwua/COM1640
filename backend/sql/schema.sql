CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
);

INSERT INTO users(email, password, role) VALUES
('admin@gmail.com', '123456', 'admin'),
('manager@gmail.com', '123456', 'qa_manager'),
('staff@gmail.com', '123456', 'staff');


CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
);

INSERT INTO categories(name) VALUES
('General'),
('Technology'),
('Education');

CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    closure TEXT,
    finalClosure TEXT
);

INSERT INTO topics(name, closure, finalClosure) VALUES
('Open Day', '2026-04-10', '2026-04-20');


CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    categoryId INTEGER,
    topicId INTEGER,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    FOREIGN KEY (categoryId) REFERENCES categories(id),
    FOREIGN KEY (topicId) REFERENCES topics(id)
);

INSERT INTO ideas(title, content, categoryId, topicId, likes, dislikes)
VALUES ('Welcome Idea', 'This is a sample idea.', 1, 1, 0, 0);


CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ideaId INTEGER,
    text TEXT,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    FOREIGN KEY (ideaId) REFERENCES ideas(id)
);

INSERT INTO comments(ideaId, text, likes, dislikes)
VALUES (1, 'This is a sample comment.', 0, 0);


CREATE TABLE IF NOT EXISTS reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userEmail TEXT,
    ideaId INTEGER,
    reaction TEXT,    -- 'like' hoặc 'dislike'
    UNIQUE(userEmail, ideaId),
    FOREIGN KEY (ideaId) REFERENCES ideas(id)
);

CREATE TABLE IF NOT EXISTS commentReactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userEmail TEXT,
    commentId INTEGER,
    reaction TEXT,    -- 'like' hoặc 'dislike'
    UNIQUE(userEmail, commentId),
    FOREIGN KEY (commentId) REFERENCES comments(id)
);