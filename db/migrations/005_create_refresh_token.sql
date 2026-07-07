CREATE TABLE refresh_tokens (
    jti VARCHAR(255) PRIMARY KEY, 
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    parent_jti VARCHAR(255) NULL 
);
