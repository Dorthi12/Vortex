-- database/community_governance_schema.sql
-- NETRAVAAH Civic Social Network Database Schema

-- 1. Community Posts (Upgraded Complaints)
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    citizen_name VARCHAR(100) DEFAULT 'Anonymous',
    status VARCHAR(50) DEFAULT 'Submitted', -- 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'
    priority_score INT DEFAULT 50 CHECK (priority_score BETWEEN 0 AND 100),
    priority_level VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    is_merged BOOLEAN DEFAULT FALSE,
    merged_into_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_priority ON community_posts(priority_level);

-- 2. Post Reactions / Supports
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reaction_type VARCHAR(50) DEFAULT 'Support', -- 'Support'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- 3. Affected Citizens Verification
CREATE TABLE IF NOT EXISTS affected_citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- 4. Post Followers (Subscriptions)
CREATE TABLE IF NOT EXISTS post_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- 5. Threaded Comments
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Comment Replies
CREATE TABLE IF NOT EXISTS comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Official Responses
CREATE TABLE IF NOT EXISTS official_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    officer_name VARCHAR(100) NOT NULL,
    officer_role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    before_photo_url VARCHAR(255),
    after_photo_url VARCHAR(255),
    completion_proof_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Community Polling
CREATE TABLE IF NOT EXISTS community_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(255) NOT NULL,
    options JSONB NOT NULL, -- list of strings e.g. ["Sector A", "Sector B"]
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Poll Votes
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES community_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    option_selected VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

-- 10. Reputation System
CREATE TABLE IF NOT EXISTS community_reputation (
    user_id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    reputation_score INT DEFAULT 0,
    contribution_level VARCHAR(50) DEFAULT 'Citizen', -- 'Citizen', 'Active Contributor', 'Community Volunteer', 'Ward Champion'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Issue Merge Groups
CREATE TABLE IF NOT EXISTS issue_merge_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    child_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    merged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- MOCK SEED RECORDS
-- =========================================================================
INSERT INTO community_reputation (user_id, username, reputation_score, contribution_level) VALUES
('47c6a992-bf39-4458-ba81-19b8417c8052', 'Jane Doe', 120, 'Active Contributor'),
('14b6df00-ca25-4122-b5e1-8899fa77cc22', 'John Smith', 350, 'Community Volunteer'),
('82a8ee00-cf32-4411-a8b2-2933fa774433', 'Priya Sharma', 620, 'Ward Champion');
