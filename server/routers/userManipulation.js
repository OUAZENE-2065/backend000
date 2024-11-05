//Get ready for retrieve data from .env file
require('dotenv').config();
// importing a module for creating API end-points
const express = require('express');

// importing a module for dealing with MySQL databases
const mysql = require('mysql');    

//importing user operations module
 const userOps = require('./userPromisesModule')

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

//Create a router
const Router = express.Router();;
Router.use(express.json());
Router.get('/:username' , (req , res) => {                     //gets user infos and "username" is used for handling username as a key or "allusers" to get all users infos
  let {username} = req.params;                                 //reading the username
  userOps.searchForUser(username).then(exists => {            //search for desired user
    if(exists){
      let safeMode = true;
      userOps.GetUserInfos(username , safeMode).then(Infos => {          // if the user exists then get oldinfos and response with them
        res.status(200).send(JSON.stringify(Infos));
      })
    }
    else{
      res.status(404).send('User is not existing!')           // if the user not found response with status 404 (not found)
    }
  })
})

Router.put('/:username' , (req , res) => {                    // update user infos according to the username given as "username" 
  let {username} = req.params;
  let newInfos = req.body;                                    // get sent infos to update
  let oldInfos = {};                                     
  userOps.searchForUser(username).then(exists => {            //search for desired user
    if(exists){
      let safeMode = false;
      userOps.GetUserInfos(username , safeMode).then(Infos => {          // if the user exists then get oldinfos and update them
        oldInfos != Infos;
        userOps.updateUserData(oldInfos , newInfos , res)
      })
    }
    else{
      res.status(404).send('User is not existing!')           // if the user not found response with status 404 (not found)
    }
  })
})

Router.delete('/:username' , (req ,res) => {                  // delete a user
  let {username}  = req.params;
  userOps.deleteUserFromDatabase(username,res);      //deletes the user
})
module.exports =Router;