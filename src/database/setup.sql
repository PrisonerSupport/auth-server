-- SETUP THE USER DB

CREATE DATABASE users;

USE users;

CREATE TABLE user (
    _id INT, 
    name VARCHAR(50), 
    email VARCHAR(50), 
    hash BINARY(32), 
    salt BINARY(16), 
    iterations INT
);
