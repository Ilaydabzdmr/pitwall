-- Önce pitwall DB'sini seç
USE pitwall;

-- Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  total_points  INT DEFAULT 0,
  joker_used    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yarış takvimi
CREATE TABLE IF NOT EXISTS races (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  jolpica_round INT,
  name          VARCHAR(100),
  circuit_name  VARCHAR(100),
  country       VARCHAR(50),
  race_date     DATE,
  status        VARCHAR(20) DEFAULT 'upcoming',
  track_svg_key VARCHAR(50),
  UNIQUE KEY unique_round (jolpica_round)
);

-- Sürücüler
CREATE TABLE IF NOT EXISTS drivers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  driver_id   VARCHAR(50) UNIQUE,
  full_name   VARCHAR(100),
  code        CHAR(3),
  team        VARCHAR(100),
  team_color  CHAR(7) DEFAULT '#ffffff',
  speed_stat  INT DEFAULT 5,
  grip_stat   INT DEFAULT 5,
  accel_stat  INT DEFAULT 5
);

-- Tahminler
CREATE TABLE IF NOT EXISTS predictions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  race_id       INT NOT NULL,
  winner        VARCHAR(50),
  pole          VARCHAR(50),
  fastest_lap   VARCHAR(50),
  dnf           VARCHAR(50),
  is_joker      BOOLEAN DEFAULT FALSE,
  points_earned INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_prediction (user_id, race_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- Oyun skorları
CREATE TABLE IF NOT EXISTS game_scores (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  race_id        INT NOT NULL,
  driver_chosen  VARCHAR(50),
  lap_time_ms    INT,
  clean_start    BOOLEAN DEFAULT FALSE,
  no_track_exit  BOOLEAN DEFAULT FALSE,
  points_earned  INT DEFAULT 0,
  played_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
);

-- Yarış sonuçları
CREATE TABLE IF NOT EXISTS race_results (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  race_id           INT NOT NULL,
  winner            VARCHAR(50),
  pole              VARCHAR(50),
  fastest_lap       VARCHAR(50),
  dnf_array         JSON,
  full_results_json JSON,
  fetched_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (race_id) REFERENCES races(id)
);

-- Pist listesi (mini oyun)
CREATE TABLE IF NOT EXISTS tracks (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(100),
  svg_key  VARCHAR(50),
  country  VARCHAR(50)
);

-- Temel pist verileri
INSERT IGNORE INTO tracks (name, svg_key, country) VALUES
('Monaco Grand Prix',   'monaco',     'Monaco'),
('Monza Grand Prix',    'monza',      'Italy'),
('Silverstone Grand Prix', 'silverstone', 'UK'),
('Spa Grand Prix',      'spa',        'Belgium'),
('Suzuka Grand Prix',   'suzuka',     'Japan');