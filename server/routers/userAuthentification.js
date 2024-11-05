//Get ready for retrieve data from .env file
require('dotenv').config();
// importing a module for creating API end-points
const express = require('express');

// importing a module for dealing with MySQL databases
const mysql = require('mysql');

// importing a module for hashing informations
const crypto = require('crypto');     

//importing user operations module
const userOps = require('./userPromisesModule');
 
// importing a module to send emails
const nodemailer = require('nodemailer');

//Loading SQL database informations
const MYSQL_CONFIGURATION = {
  host : process.env.DB_HOST,
  user : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  port : process.env.DB_PORT,
  database : process.env.DB_DATABASE
}

//Create a connection to the database using the loaded informations 
const Pool = mysql.createPool(MYSQL_CONFIGURATION);
Pool.getConnection((err) => {
  if(err){
    console.log(err);
  }
  else{
    console.log('connected to the database');
  }
})


//Create a connection to gmail
const transport = nodemailer.createTransport({
  service:'gmail',
    auth:{
        user: 'aamasaamas222@gmail.com',
        pass:'befq qoyf gaaf urwn',
    }
})

//Test the connection to gmail...
transport.verify((err) => {
    if(err){
        console.log(err)
    }
    else{
        console.log('connected to gmail...')
    }
})

//Create a router
const Router = express.Router();
Router.use(express.json())

//Create an dictionary of tokens as keys and their users as values and delete them after verification or after expiring
let nonVerifiedTokens = {};

Router.post('/check-email' , (req , res) => {    //here we recieve request to get verification mail

  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  // Slice to keep everything before '/my_router'
  const index = fullUrl.indexOf('/check-email');
  const urlBeforeMyRouter = index !== -1 ? fullUrl.slice(0, index) : fullUrl;

  const USER_INFOS = req.body;       // getting the sent user informations

  //Check if email and username are not existing...
    Pool.query(`select * from users where email ='${USER_INFOS.email}' or username = '${USER_INFOS.username}';` , (err , data) => {
        if(err){
            console.log('Database err:' + err);
            res.status(500).send('Internal server error!');
        } 
        else{
            if(data.length > 0){

              //It means the we selected an account with this email or username
                res.status(401).send('email or username already exists');
            }
            else{
                let token = GenerateToken(USER_INFOS);      //Generates verification token
                transport.sendMail({
                    from:'aamasaamas222@gmail.com',
                    to: USER_INFOS.email,
                    subject : 'Verify your e-mail',         //sends mail with the verification link
                    html : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f6f6f6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .email-container {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      border-radius: 8px;
    }
    h2 {
      color: #2c3e50;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
    }
    a {
      background-color: #3498db;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      display: inline-block;
      margin-top: 20px;
      font-size: 16px;
    }
    .footer {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h2>Verify Your Email Address</h2>
    <p>Hi ${USER_INFOS.fname} ${USER_INFOS.lname},</p>

    <p>Thank you for signing up! To complete your registration and activate your account, please verify your email address by clicking the link below:</p>

    <a href="${urlBeforeMyRouter}/verify/${token}" target="_blank">Verify My Email</a>

    <p>If you didn’t sign up for an account, you can safely ignore this email.</p>

    <p>Thanks, <br>The Eduverse Team</p>

    <div class="footer">
      <p>If you’re having trouble clicking the "Verify My Email" button, copy and paste the URL below into your web browser:</p>
      <p> ${urlBeforeMyRouter}/verify/${token} </p>
    </div>
  </div>
</body>
</html>
`
                },(err) => {
                    if(err){
                        console.log("Mail sending err" + err);          //an error occured while sending the mail
                        res.status(500).send('Internal server error!');
                    }
                    else{
                        res.status(200).send('verification email sent!'); //mail sent sucessfully
                      
                    }
                }
            );
            }
        }
    })
})

Router.get('/verify/:token' , (req , res) => {  //verify the mail
  let {token}  = req.params;     //get the token to verify
  let data = nonVerifiedTokens[token];  //get the user related to that token
  if(data == undefined){            //if token is not existing (due to time expired for example) we send an error message
    res.send(`
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            padding: 20px;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #dc3545; /* Red color for error */
          }
          p {
            font-size: 16px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Verification Failed</h1>
          <p>Unfortunately, we couldn't verify your email. Please try again or contact support.</p>
        </div>
      </body>
      </html>
    `);
  }
  else{
    userOps.addUserIntoDatabase(data, req , res , `/verify`);
  }
})

Router.post('/login' , (req , res) => {     //login
  let user = req.body                       //reading the data sent from front-end;
  let hash = crypto.createHash('sha256').update(user.password).digest('hex'); //get the hashed password
  Pool.query(`select * from users where (username ='${user.username}' or email = '${user.username}') and (user_password = '${hash}');`, (err , data) => {   //get the appripriate account
    if(err){
      console.log(err);
      res.status(500).send('Internal server error!')
    }
    else if (data.length == 0){
      //no account found
      res.status(403).send('Invalid login');
    }
    else{
      //valid login
      res.status(200).send(JSON.stringify({
        username : data[0].username
      }));
    }
  }) 
})
/**
 * This function generates tokens for verifying the emails
 * @param {object} user -the desired user informations
 * @returns {string} -the verification token
 */
function GenerateToken(user){ 
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabsdefghijklmnopqrstuvwxyz01234567899'; //the characters which we'll use in the token
  let token = ''; // the variable which we'll store the token 

  for(let i = 0 ; i < 2 ; i++){ 
      token += LETTERS[Math.floor(Math.random() * 62)];   //a Loop that generates 6 chars randomly
  } 

  var datetime = new Date().toISOString();
  datetime = datetime.split(':').join('')
      .split('-').join('')                        //use a formatted date and time to add it to our token (unicity)
          .split('.').join('');
  token = token[0] + datetime + token[1] ; // add the data inside the token forexample
  nonVerifiedTokens[token] = user;            // add user with key token  to the dictionary  
  setTimeout(() => {
    delete nonVerifiedTokens[token]      //set 5 min as expiration time
  }, 5 * 60000)
  return token; 
}

module.exports = Router;