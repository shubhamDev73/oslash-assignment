CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(1000)
);
CREATE TABLE shortcuts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    shortlink VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    tags VARCHAR(1000),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
            REFERENCES users(id)
);
CREATE INDEX idx_users_username on users (username);
CREATE INDEX idx_shortcuts_user_id on shortcuts (user_id);
CREATE UNIQUE INDEX idx_shortcuts_user_shortlink on shortcuts (user_id, shortlink);
