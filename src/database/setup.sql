-- SETUP THE USER DB

CREATE DATABASE users;

USE users;

CREATE TABLE user (
    username VARCHAR(20) NOT NULL, 
    name VARCHAR(100), 
    email VARCHAR(50) NOT NULL, 
    hash BINARY(32) NOT NULL, 
    salt BINARY(16) NOT NULL, 
    iterations INT NOT NULL
    PRIMARY KEY (username)
);
