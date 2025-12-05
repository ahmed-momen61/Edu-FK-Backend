# EduFlow-Knowledge | Backend System

**Milestone 4 Submission**
Course: Internet & Web Technologies  
Student: Ahmed Mo'men  
ID: 202301532

## Project Overview
EduFlow-Knowledge is a backend system servicing a Learning Management System (LMS) and encompasses user log-in credentials, session handlings, and handling and distributing user triggered events automcatially as they enter a user authenticated session with the system. This backend system built with Node.js and SQLite and employs a system protection and performance securing protocol (HttpOnly Cookies, Device Fingerprinting) as the system runs seamlessly with high security.

## Tech Stack & Tools
Runtime:Node.js
Framework: Express.js
Database:SQLite3 (Standard Native Driver)
Security:`bcryptjs`, `jsonwebtoken`, `cookie-parser`
File Handling:Multer

---

## Code Structure & Logic Explained

Here is a detailed breakdown of the core files and the logic behind them:
-----------------------
1. server.js (The Entry Point)
Role: The application's main entry point referred to as "The Maestro".

Logic:

- Initialization: Start the app with using Express and have the app listen to port 3000.

- Middleware Setup: Add cookie-parser (for reading secure Cookies) and express.json (for parsing the body of JSON requests).

- Security Guard (verifyToken): Specific custom middle layer security software protection of sensitive route. Device Fingerprinting is used to track the current user's IP and User agent and compared to the data stored safely in the Token. If they are different the layer is triggered (Session Hijacking is prevented).

- Routing: Passes the user's requests to the proper controller. The user's requests are authenticated as they enter the documented endpoint (for example, /api/auth).
-----------------------
2. config/db.js (Database Engineer) 
Role: Oversees connection to the database and its schema.

Logic:

Connect to eduflow.db sqlite file.
Auto-Schema Creation: Upon initialization, the app runs some SQL commands to create the USER, SUBMISSION, and NOTIFICATION tables. This make the system Plug and Play to avoid having to manually create the database.

Generalization: Applies the Single Table Inheritance strategy to User (Student, Faculty, and Admin) so their roles can be differentiated using ROLE column.
-----------------------
3. controllers/authController.js (The Gatekeeper for Security) 
Role: Registration, Login and Session Control. 

Logic:

Hashing: Passwords are never stored as plain text. bcrypt salts and hash the password 

Token Generation: During login, the system creates a JWT (JSON Web Token) that also has a Device Fingerprint (IP + Browser Info) inside the payload token to establish control over that token. 

Secure Delivery: the token gets sent to the client from the backend through HttpOnly Cookie so that client-side JavaScript cannot read the token and perform XSS attacks.
-----------------------   
4. The Librarian
Role:* Oversees assignment uploads and maintains submission status.

Logic:

File Handling:Employs 'Multer' middleware to deal with PDF and image file uploads and subsequently saves these files to the 'uploads/' directory.

Data Recording: Adds a new entry into the 'SUBMISSION' table that associates the file directory with a specific Student ID and Assignment ID.

Notification Trigger: Adding a new row into the NOTIFICATION table that informs the relevant Instructor is triggered as a final step after a submission is successfully processed.
-----------------------
5. The Data Seeder
Role: This is a simple script that serves to initialize and test the application.

Logic:

Actors: This script is designed to manage *Admin*, *Faculty*, and *Students*.

For each actor in the list, the script verifies whether the actor already exists in the application in order to prevent duplicate entries. The script will hash the value '123…' as their password and subsequently insert the actor into the application.

This automated process ensures that the application can be tested without having to go through the registration process individually.

How to Run the Project
1. Prerequisites
Please ensure you have Node.js as your Runtime Environment, version 20 in LTS is preferred.

2. Installation
Clone the repository and then install any package that the application may depend on:


git clone https://github.com/ahmed-momen61/EduFlow-Backend.git
cd EduFlow-Backend
npm install

PostMan Link :-
https://aa2301532-3476503.postman.co/workspace/Ahmed's-Workspace~e063bf8a-1270-4c82-8696-cda0878f7829/request/49248489-bdc0a6d9-4c94-4925-b4ef-67802e251831?action=share&creator=49248489

