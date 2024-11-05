/**
 * a module that provides manipulation of the users
 * @module userOps
 * 
 */

require('dotenv').config();

// importing a module for dealing with MySQL databases
const mysql = require('mysql2/promise');

// importing a module for hashing informations
const crypto = require('crypto');
const express = require('express');
const { create } = require('domain');

//Read SQL coniguration from .env
const MYSQL_CONFIGURATION = {
  host : process.env.DB_HOST,
  user : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  port : process.env.DB_PORT,
  database : process.env.DB_DATABASE
}

/**
 * This function adds a user into the database
 * @param {object} user -object {fname , lname , email , password(non-hashed) , username}
 * @param {Response} res - This is responsible to send response to the front-end
 * @returns {void}
 */

async function addUserIntoDatabase(user, req , res, router_parent){
  
  //Create a connection to the database using the loaded informations 
  const Pool = mysql.createPool(MYSQL_CONFIGURATION);

  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  // Slice to keep everything before '/my_router'
  const index = fullUrl.indexOf(router_parent);
  const urlBeforeMyRouter = index !== -1 ? fullUrl.slice(0, index) : fullUrl;
  //test the connection
  var hash = crypto.createHash('sha256').update(user.password).digest('hex')     //hashing the password
  var date = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`   //getting the date now
  try{
    await Pool.query(`INSERT INTO users(fname , lname , email , user_password , username , created , updated) values ('${user.fname}','${user.lname}','${user.email}','${hash}','${user.username}','${date}', '${date}')` ) ; // try to insert into db
    // user is sucessfully added to the database so send sucess message
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
      color: #28a745; /* Green color for success */
    }
    p {
      font-size: 16px;
      line-height: 1.5;
    }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 15px;
      background-color: #007bff; /* Bootstrap primary color */
      color: white;
      text-decoration: none;
      border-radius: 5px;
      transition: background-color 0.3s;
    }
    a:hover {
      background-color: #0056b3; /* Darker blue on hover */
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Email Verified Successfully</h1>
    <p>Your email has been successfully verified. You can now log in to your account.</p>
    <!-- <a href="${urlBeforeMyRouter}">Go to the login page</a> -->
  </div>
</body>
</html>
      `);
  } 
  catch(err) {
    // If email is not verified
    console.log(err)    //send a failed message
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
}

/**
 * This function update the user's information in the data base
 * @param {object} oldInfos -The old informations {fname , lname , email , password(non-hashed) , username}
 * @param {object} newInfos -The updated informations {fname , lname , email , password(non-hashed) , username}
 * @param {Response} res -The response which the server sends
 * @returns {void}
 */
async function updateUserData(oldInfos , newInfos , res){
  newInfos.username = newInfos.username || oldInfos.username;
  newInfos.fname = newInfos.fname || oldInfos.fname;
  newInfos.email = newInfos.email || oldInfos.email;                        //put unchanged and changed infos in newInfos
  newInfos.lname = newInfos.lname || oldInfos.lname;
  newInfos.user_password = newInfos.password || oldInfos.user_password;
  //Create a connection to the database using the loaded informations 
  const Pool = mysql.createPool(MYSQL_CONFIGURATION);
  //test the connection
  if(newInfos.username != oldInfos.username ||  newInfos.email != oldInfos.email){
    // if there is a change in email or user name we check if the new email and username are not existing in other accounts...
    let data = await Pool.query(`select * from users where username = '${newInfos.username}' or email = '${newInfos.email}'`);
    /*
        after selecting we distinguish 4 cases:
          1- we selected an email of an account and a username of another account which means
             than one account selected and email or username already exists in another accounts   (data.length > 1)
          2- both email and username refers to the same account but it is not yours  (data[0].id != oldInfos.id)
          3- we selected your account which is acceptable
          4- we selected 0 accounts (both email and username are not existing...)
    */
    if (data.length > 1 || (data.length == 1 && data[0].id != oldInfos.id)){
       //there exists an account with this email and username
      res.status(401).send('username or email already exits');
    }
    else{
      //hash new passowrd
      let newPassword = crypto.createHash('sha256').update(newInfos.user_password).digest('hex');
      //Getting updating date
      let date = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
      //updating the database
      try{
        await Pool.query(`UPDATE users set fname = '${newInfos.fname}' , lname = '${newInfos.lname}' , email = '${newInfos.email}' , 
          user_password = '${newPassword}' , username = '${newInfos.username}' , updated = '${date}' where username = '${oldInfos.username}'` );
        res.status(200).send('user updated sucessfully');
      }
      catch(err){
        console.log(err);
        res.status(500).send('Internal server error!')
      }
    }
  }
  else{
    //Otherwise we update directly
    //hash new passowrd
    let newPassword = crypto.createHash('sha256').update(newInfos.user_password).digest('hex');

    //Getting updating date
    let date = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;

    //updating the database
    try{
      await Pool.query(`UPDATE users set fname = '${newInfos.fname}' , lname = '${newInfos.lname}' , email = '${newInfos.email}' , 
        user_password = '${newPassword}' , username = '${newInfos.username}' , updated = '${date}' where username = '${oldInfos.username}'` );
      res.status(200).send('user updated sucessfully');
    }
    catch(err){
      console.log(err);
      res.status(500).send('Internal server error!')
    }
  } 
}
/**
 * This function search for a user and returns a promise containing all his infos based on his user name
 * if you passed 'allusers' as a parameter it will return an array of all users
 * @param {string} username  - the username of the user which you search for or 'alluser' if you want to get all users infos
 * @param {boolean} safely   - choose if you want to get infos with password or not
 * @returns {Promise<object> | Promise<Array> | Promise<undefined>}
 */
async function GetUserInfos(username , safely){
  //Create a connection to the database using the loaded informations 
  const Pool = mysql.createPool(MYSQL_CONFIGURATION);
  if(username == 'allusers'){
    let data = await Pool.query('Select * from users');   //Getting data (this gives an array of two arrays one for user infos and other for table infos)
    let finalData = safely ? removeSensetiveData(data[0]) : data[0]; 
    return finalData;
  }
  else{
    let data = await Pool.query(`Select * from users where username = '${username}'`);   //Getting data (this gives an array of two arrays one for user infos and other for table infos)
    let finalData = safely ? removeSensetiveData(data[0]) : data[0]; 
    return finalData[0];
  }
}




/**
 * This function search for a user according to his user name and returns if he exists or not   
 * @param {string} username  - the username of the user which you search for
 * @returns {Promise<boolean>}
 */
async function searchForUser(username){
  //Create a connection to the database using the loaded informations 
  const Pool = mysql.createPool(MYSQL_CONFIGURATION);
  let data = await Pool.query(`Select * from users where username = '${username}'`);   //Getting data (this gives an array of two arrays one for user infos and other for table infos)
  
  return data[0].length > 0;
}


/**
 * This function deletes user from database
 * @param {object} username -the username of the user which you would delete
 * @param {Response} res  - This is responsible to send response to the front-end
 */
async function deleteUserFromDatabase(username , res){
  //Create a connection to the database using the loaded informations 
  const Pool = mysql.createPool(MYSQL_CONFIGURATION);


  //deleting the user
  try{
    await Pool.query(`delete from users where username = '${username}'`);
    res.status(200).send('Sucess!')
  }
  catch(err){
    console.log(err)
    res.status(500).send('Internal server error!');
  }
}

/**
 * This function removes sensetive data from the user infos such as passwords
 * @param {Array} userInfos -The original users informations
 * @returns {Array}  -users information without sensetive data 
 */
function removeSensetiveData(userInfos){
  let newData = [];                     //the array which we will put the secure data
  for(let Info of userInfos){
    let newInfo = {
      fname : Info.fname,
      lname : Info.lname,            //creating new object wihtout password 
      username : Info.username,
      email : Info.email,
      created : Info.created,
      updated : Info.updated
    }
    newData.push(newInfo)                 //put new infos in newData
  }
  return newData;
}
module.exports.addUserIntoDatabase = addUserIntoDatabase;
module.exports.updateUserData = updateUserData;
module.exports.searchForUser = searchForUser;
module.exports.GetUserInfos = GetUserInfos;
module.exports.deleteUserFromDatabase = deleteUserFromDatabase;
module.exports.removeSensetiveData = removeSensetiveData;