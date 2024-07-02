# website- https://learny-creative-hummingbird-4bce38.netlify.app
# client side - https://github.com/Nisha0202/learny-client

## Project Overview
- **Concept:** Learny a collaborative study platform designed to facilitate student learning and interaction.
- **Problem Solved:** Enhances study collaboration by providing tools for scheduling sessions, managing materials, and secure communication.

## Features
- **User Role-Based Authorization:** Different access levels for students, tutors and admins.
- **Payment method for booking session** Students can securely pay for booked sessions using online payment method.
- **Manage Session and Materials :** Allows students to book sessions, access materials, tutors to create study sessions and upload materials and admin to manage all seamlessly.

## Technologies Used
1. Node.js: Server-side JavaScript runtime.
2. Express.js: Web application framework for Node.js.
3. MongoDB Atlas: Cloud-hosted MongoDB database.
4. Firebase Authentication: Used for user authentication (signup, login with email, and Google login).
5. dotenv: Module to load environment variables from a .env file.
6. CORS: Middleware to enable Cross-Origin Resource Sharing.
7. jsonwebtoken (JWT): Used for generating and verifying JSON Web Tokens.
8. bcrypt: Library for hashing passwords.
9. Stripe: Payment processing platform.

## Admin Control
- **Email:** admin@gmail.com
- **Password:** Adminn

## Cloning and Local Setup
1. Clone the Repository : git clone https://github.com/Nisha0202/learny-server.git or download zip
2. Install dependencies using `npm install`
3. Update MongoDB url to your MongoDB database url
4. Set a JWT secret key.
5. Set Stripe Api key for server side.
6. Start the Server `nodemon ./index.js`
7. Clone and set up client(https://github.com/Nisha0202/learny-client) side to see the UI.



