# Networks Project

This repository will be where we keep the source code for the Computer Networks project.

We are designing a web-based instant messaging platform, which will feature user authentication, end-to-end encryption, password hashing, and persistent message history. For the sake of simplicity, this platform will start off as a two-way communication system (no group chats).

The frontend features a sign up page, a login page, and a simple chat interface. Upon launch, users are directed to the sign in page, where they can either sign into an existing account or click a button to create a new account. When the user chooses to create an account, they are asked to enter a username, a password, and then a re-entry of their password for verification. Once the account is created, the user's login information is stored in a cluster within MongoDB Atlas, which was the chosen database for this system. The user database stores the user's username, hashed password, and the public key used in the RSA encryption scheme. After sign up, the user can log in with their account at any time. Upon a successful login, the user is redirected to the chat page, where they can select another user with which they would like to chat and then begin sending messages. After encryption, messages are also stored in a message database within MongoDB.
