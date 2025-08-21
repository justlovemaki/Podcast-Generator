--
-- SQLiteStudio v3.4.17 生成的文件，周三 8月 20 17:58:34 2025
--
-- 所用的文本编码：System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- 表：__drizzle_migrations
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id         SERIAL  PRIMARY KEY,
    hash       TEXT    NOT NULL,
    created_at NUMERIC
);


-- 表：account
CREATE TABLE IF NOT EXISTS account (
    id                       TEXT    PRIMARY KEY
                                     NOT NULL,
    account_id               TEXT    NOT NULL,
    provider_id              TEXT    NOT NULL,
    user_id                  TEXT    NOT NULL,
    access_token             TEXT,
    refresh_token            TEXT,
    id_token                 TEXT,
    access_token_expires_at  INTEGER,
    refresh_token_expires_at INTEGER,
    scope                    TEXT,
    password                 TEXT,
    created_at               INTEGER NOT NULL,
    updated_at               INTEGER NOT NULL,
    FOREIGN KEY (
        user_id
    )
    REFERENCES user (id) ON UPDATE NO ACTION
                         ON DELETE CASCADE
);


-- 表：points_accounts
CREATE TABLE IF NOT EXISTS points_accounts (-- 账户ID，使用自增整数作为主键，效率最高。
    account_id   INTEGER PRIMARY KEY AUTOINCREMENT,-- 关联的用户ID，设置为 TEXT 类型以匹配您的设计。
    /* 添加 UNIQUE 约束确保一个用户只有一个积分账户。 */user_id      TEXT    NOT NULL
                         UNIQUE,-- 当前总积分，非负，默认为 0。
    total_points INTEGER NOT NULL
                         DEFAULT 0
                         CHECK (total_points >= 0),-- 最后更新时间，使用 TEXT 存储 ISO8601 格式的日期时间。
    /* 在记录更新时，应由应用程序逻辑来更新此字段。 */updated_at   TEXT    NOT NULL
);


-- 表：points_transactions
CREATE TABLE IF NOT EXISTS points_transactions (-- 流水ID，使用自增整数主键。
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,-- 关联的用户ID。
    user_id        TEXT    NOT NULL,-- 本次变动的积分数，正数代表增加，负数代表减少。
    points_change  INTEGER NOT NULL,-- 变动原因代码，方便程序进行逻辑判断。
    reason_code    TEXT    NOT NULL,-- 变动原因的文字描述，可为空。
    description    TEXT,-- 记录创建时间，默认为当前时间戳。
    created_at     TEXT    NOT NULL
                           DEFAULT CURRENT_TIMESTAMP
);


-- 表：session
CREATE TABLE IF NOT EXISTS session (
    id         TEXT    PRIMARY KEY
                       NOT NULL,
    expires_at INTEGER NOT NULL,
    token      TEXT    NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id    TEXT    NOT NULL,
    FOREIGN KEY (
        user_id
    )
    REFERENCES user (id) ON UPDATE NO ACTION
                         ON DELETE CASCADE
);


-- 表：user
CREATE TABLE IF NOT EXISTS user (
    id               TEXT    PRIMARY KEY
                             NOT NULL,
    name             TEXT    NOT NULL,
    email            TEXT    NOT NULL,
    email_verified   INTEGER NOT NULL,
    image            TEXT,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL,
    username         TEXT,
    display_username TEXT
);


-- 表：verification
CREATE TABLE IF NOT EXISTS verification (
    id         TEXT    PRIMARY KEY
                       NOT NULL,
    identifier TEXT    NOT NULL,
    value      TEXT    NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
);


-- 索引：idx_points_accounts_user_id
CREATE INDEX IF NOT EXISTS idx_points_accounts_user_id ON points_accounts (
    user_id
);


-- 索引：idx_points_transactions_user_id
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions (
    user_id
);


-- 索引：session_token_unique
CREATE UNIQUE INDEX IF NOT EXISTS session_token_unique ON session (
    token
);


-- 索引：user_email_unique
CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON user (
    email
);


-- 索引：user_username_unique
CREATE UNIQUE INDEX IF NOT EXISTS user_username_unique ON user (
    username
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
