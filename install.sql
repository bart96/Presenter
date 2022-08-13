START TRANSACTION;

CREATE TABLE `account` (
	`license`      INT(11)      NOT NULL,
	`mail`         VARCHAR(200) NOT NULL,
	`lastActivity` TIMESTAMP    NOT NULL DEFAULT current_timestamp()
) ENGINE = MyISAM
  DEFAULT CHARSET = utf8;

-- --------------------------------------------------------

CREATE TABLE `blocks` (
	`account`    INT(11)     NOT NULL,
	`songNumber` INT(11)     NOT NULL,
	`type`       VARCHAR(60) NOT NULL,
	`text`       TEXT        NOT NULL
) ENGINE = MyISAM
  DEFAULT CHARSET = utf8;

-- --------------------------------------------------------

CREATE TABLE `shows` (
	`account` INT(11)      NOT NULL,
	`title`   VARCHAR(200) NOT NULL,
	`date`    TIMESTAMP    NOT NULL DEFAULT current_timestamp(),
	`order`   TEXT         NOT NULL
) ENGINE = MyISAM
  DEFAULT CHARSET = utf8;

-- --------------------------------------------------------

CREATE TABLE `songs` (
	`account`      INT(11)      NOT NULL,
	`songNumber`   INT(11)      NOT NULL,
	`title`        VARCHAR(300) NOT NULL,
	`authors`      VARCHAR(300) NOT NULL,
	`copyright`    VARCHAR(600) NOT NULL,
	`initialOrder` VARCHAR(150) NOT NULL,
	`order`        VARCHAR(300) NOT NULL
) ENGINE = MyISAM
  DEFAULT CHARSET = utf8;

-- --------------------------------------------------------

ALTER TABLE `account`
	ADD PRIMARY KEY (`license`);

ALTER TABLE `blocks`
	ADD KEY `fk_song` (`account`, `songNumber`);
ALTER TABLE `blocks`
	ADD FULLTEXT KEY `text` (`text`);

ALTER TABLE `shows`
	ADD PRIMARY KEY (`account`, `title`);

ALTER TABLE `songs`
	ADD PRIMARY KEY (`account`, `songNumber`);
ALTER TABLE `songs`
	ADD FULLTEXT KEY `title` (`title`);

COMMIT;