CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  chain_market_id INTEGER DEFAULT 0,
  creator TEXT NOT NULL,
  market_type TEXT NOT NULL CHECK(market_type IN ('SPORTS','CRYPTO','POLITICAL','ENTERTAINMENT','OTHER')),
  question TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT '',
  deadline BIGINT NOT NULL,
  resolution_time BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','CLOSED','RESOLVED','VOIDED')),
  outcome TEXT DEFAULT 'NONE' CHECK(outcome IN ('NONE','YES','NO')),
  yes_pool TEXT DEFAULT '0',
  no_pool TEXT DEFAULT '0',
  creator_fee_bps INTEGER DEFAULT 100,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id),
  user_address TEXT NOT NULL,
  side TEXT NOT NULL CHECK(side IN ('YES','NO')),
  amount TEXT NOT NULL,
  tx_hash TEXT,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  chain_agent_id INTEGER DEFAULT 0,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  specialization TEXT DEFAULT 'crypto',
  strategy_type TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0,
  total_funds TEXT DEFAULT '0',
  active INTEGER DEFAULT 1,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(id),
  user_address TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

CREATE TABLE IF NOT EXISTS agent_predictions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  market_id INTEGER NOT NULL REFERENCES markets(id),
  prediction TEXT NOT NULL CHECK(prediction IN ('YES','NO')),
  confidence INTEGER DEFAULT 50,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
  UNIQUE(agent_id, market_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  user_address TEXT NOT NULL,
  deposited TEXT DEFAULT '0',
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
  UNIQUE(agent_id, user_address)
);
