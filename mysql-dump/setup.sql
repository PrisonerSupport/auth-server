CREATE DATABASE IF NOT EXISTS testdb;

CREATE DATABASE IF NOT EXISTS user;
USE user;

CREATE TABLE IF NOT EXISTS user (
    username VARCHAR(30) NOT NULL, 
    name VARCHAR(255), 
    email VARCHAR(255) NOT NULL, 
    hash BINARY(32) NOT NULL, 
    salt BINARY(16) NOT NULL, 
    iterations INT NOT NULL,
    PRIMARY KEY (username)
);

USE testdb;

CREATE TABLE IF NOT EXISTS user (
    username VARCHAR(30) NOT NULL, 
    name VARCHAR(255), 
    email VARCHAR(255) NOT NULL, 
    hash BINARY(32) NOT NULL, 
    salt BINARY(16) NOT NULL, 
    iterations INT NOT NULL,
    PRIMARY KEY (username)
);

 CREATE USER IF NOT EXISTS `authserver`@`localhost` IDENTIFIED BY 'dummy';
 GRANT ALL PRIVILEGES ON user.* TO 'authserver'@'localhost';
 GRANT ALL PRIVILEGES ON testdb.* TO 'authserver'@'localhost';