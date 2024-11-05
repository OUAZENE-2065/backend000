# User API Documentation

## Overview

This API provides endpoints for a basic chat application. It allows users to register, log in, send messages, retrieve messages, and manage chat rooms.

## Authentication

This API deals sends verification mails , add users to DB and check the login 

## Endpoints

### 1. Request for send the mail 

- **URL:** `/`
- **Method:** `POST`
- **Description:** sends verification email
- **Request Body:**

    ```json
    {
      "fname" : "string",
      "lname" : "string",
      "email" : "string",
      "password": "string",
      "username": "string",
    }
    ```

- **Response:**

    - `200 Created`: Verification email sent sucess fully
    - `401 Bad Request`: email or username already exists
    - `500 Internal server error` : error in the server

### 2. Login

- **URL:** `/login`
- **Method:** `POST`
- **Description:** Logs in an existing user;.
- **Request Body:**

    ```json
    {
      "username": "string (email or username)",    
      "password": "string"
    }
    ```

- **Response:**

    - `200 OK`: sucess!
    - `403 Unauthorized`: Incorrect credentials
    - `500 Internal server error` : Internal server error!

## Manipulation
### 1. Get User Information

- **URL:** `/:username (":" means that this is a parameter you can user 'allusers' to get allusers infos)`
- **Method:** `GET`
- **Description:** Get user infos without sensetive data=

- **Response:**

    - `200 OK`: Returns an array of users or one user as object
    - `500 Internal server error` : error in the server
    - `404 Not found` : if the user is not existing

### 2. Update user information

- **URL:** `/:username`
- **Method:** `PUT`
- **Description:** update user information
- **Request Body:**

     ```json
    {
      "fname" : "string (optional)",
      "lname" : "string (optional)",
      "email" : "string (optional)",
      "password": "string (optional)",
      "username": "string (optional)",
    }
    ```

- **Response:**

    - `200 OK`: user updated
    - `401 Bad Request`: new username or email exists in another account
    - `500 Internal server error` : error in the server

### 2. delete user

- **URL:** `/:username`
- **Method:** `DELETE`
- **Description:** delete user 

- **Response:**

    - `200 OK`: user deleted
    - `500 Internal server error` : error in the server
## Error Codes

- **400 Bad Request:** Invalid input data
- **401 Unauthorized:** Missing or invalid token
- **404 Not Found:** Resource not found

## Example Usage

### Request for send the mail 

```js
fetch('http://your-api-url/',{
  method : 'POST',
  body :JSON.stringify({
    fname : 'your-first-name',
    lname : 'your-last-name',
    email : 'example@gmail.com',
    password : 'your-password',
    username : 'your-username'
  }),
  headers:{
    'Content-Type':'application/json'
  }
}).then(res => {
  if(res.status == 200){
    res.text().then(data => console.log(data))
  }
  else{
    res.text().then(data => console.log(data))
  }
})
