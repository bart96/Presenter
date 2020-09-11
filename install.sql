
START TRANSACTION;

CREATE TABLE `account` (
  `license` int(11) NOT NULL,
  `mail` varchar(200) NOT NULL,
  `song_index` int(11) NOT NULL DEFAULT '0',
  `lastactivity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE `blocks` (
  `account` int(11) NOT NULL,
  `songnumber` int(11) NOT NULL,
  `type` varchar(60) NOT NULL,
  `text` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE `songs` (
  `account` int(11) NOT NULL,
  `songnumber` int(11) NOT NULL,
  `title` varchar(300) NOT NULL,
  `initialOrder` varchar(150) NOT NULL,
  `order` varchar(300) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;


CREATE TABLE `shows` (
  `account` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `order` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
COMMIT;



ALTER TABLE `account`
  ADD PRIMARY KEY (`license`);


ALTER TABLE `blocks`
  ADD KEY `fk_song` (`account`,`songnumber`);
ALTER TABLE `blocks` ADD FULLTEXT KEY `text` (`text`);


ALTER TABLE `songs`
  ADD PRIMARY KEY (`account`,`songnumber`);
ALTER TABLE `songs` ADD FULLTEXT KEY `title` (`title`);


ALTER TABLE `shows`
  ADD PRIMARY KEY (`account`,`title`);

COMMIT;
