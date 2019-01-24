DROP TABLE `chat`.`messages` ; 

CREATE TABLE `chat`.`messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_name` varchar(30) DEFAULT NULL,
  `to_name` varchar(30) DEFAULT NULL,
  `message` text,
  `time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


