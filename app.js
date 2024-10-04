const express = require("express");
const app = express();
const mongoose = require("mongoose")
const bcrypt = require ("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config();

var nodemailer = require('nodemailer');

app.set("view engine","ejs"); // for the reset password

const PORT = process.env.PORT || 3000;

app.use(express.json());  
app.use(express.urlencoded({ extended: true })); 


// const monogoURL = process.env.MONOG_DB_URL
const monogoURL = "mongodb+srv://imcarl0uc:adminPassword@budgetbuddy.qnomn.mongodb.net/?retryWrites=true&w=majority&appName=BudgetBuddy"

const JWT_SECERT = "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jdsds039[]]pou89ywe"
mongoose.connect(monogoURL)
.then(()=>{
    console.log("DataBase Connected");
})
.catch((e)=>{
    console.log(e);
})

require("./UserDetails"); 
const User =mongoose.model("UserInfo") 


//API FOR REGISTER
app.post("/register", async(req,res)=>{
    const {name, email, mobile, password} = req.body
    const oldUser = await User.findOne({email: email});

    if(oldUser){
        res.send("User already exist try another email address")
    }
    const encrptedPassword = await bcrypt.hash(password, 12)

    try {
        await User.create({
            name:name,
            email:email,
            mobile:mobile,
            password:encrptedPassword,
        })
        res.send({status: "ok", data:"User Created Succesfully"})
    } catch (error) {
        res.send({status: "error", data: "error"});
    }
})

//API FOR LOGIN SESSION 
app.post("/login-user", async(req,res)=>{
    const {email, password} = req.body;
    const oldUser = await User.findOne({email: email})

    if(!oldUser){
        return res.send({data: "User dose not exist"})
    }


    // for password now!
    if(await bcrypt.compare(password, oldUser.password)){
        const token = jwt.sign({email: oldUser.email}, JWT_SECERT,{expiresIn:"1h"})
        console.log(token);
        return res.status(200).send({status:"ok", data: token})
    }
    else{
        return res.status(200).send({error:"Invalid Password"})
    }
})

app.post("/user-data", async(req,res)=>{
    const {token} = req.body;

    try {
        const user =jwt.verify(token, JWT_SECERT)
        const useremail = user.email
        User.findOne({email: useremail})
        .then((data)=>{
            return res.send({status: "ok", data: data})
        })
    } catch (error) {
        return res.status(401).send({error:"Invalid Token"})
    }
});


app.post("/forgot-password", async(req,res)=>{
    const {email} = req.body;
    try {
        const oldUser = await User.findOne({email})
        if(!oldUser){
            return res.json({status: "User Does Not Exist"})
        }
        const secret = JWT_SECERT + oldUser.password;
        const token = jwt.sign({email: oldUser.email, id: oldUser._id},secret,{expiresIn:"5m"});
        const link = `https://budgetbuddy1-j5q67ysm.b4a.run/reset-password/${oldUser._id}/${token}`;

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: "carluchenna23@gmail.com",
              pass: "evcj ekcm adln kgqg",
            }
          });
          
          var mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: oldUser.email,
            subject: 'Password Reset',
            text: `Hi ${oldUser.name}, We received a request to reset the password for your BudgetBuddy account. 
            To proceed, please click the link below:${link}
            If you did not request this change, please ignore this email, and your password will remain the same.
            Thank you for using BudgetBuddy!
            Best regards,
            The BudgetBuddy Team`,
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

        console.log(link);
    } catch (error) {
        
    }
});
app.get("/reset-password/:id/:token",async(req,res)=>{
    const {id, token} = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({_id: id})
    if(!oldUser){
        return res.json({status: "User Does Not Exist"})
    }
    const secret = JWT_SECERT + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index",{email: verify.email, status:"Not Verified"})
    } catch (error) {
        res.send("Not Verifed")
    }

});

app.post("/reset-password/:id/:token",async(req,res)=>{
    const {id, token} = req.params;
    const {password} = req.body;
    console.log(req.params);
    const oldUser = await User.findOne({_id: id})
    if(!oldUser){
        return res.json({status: "User Does Not Exist"})
    }
    const secret = JWT_SECERT + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encrptedPassword = await bcrypt.hash(password,10);
        await User.updateOne(
            {
                _id:id,
            },
            {
                $set:{
                    password: encrptedPassword,
                },
            }

        );
        res.json({status:"Password Updated"})
        res.render("index",{email: verify.email, status:"Verified"})

    } catch (error) {
        res.json({status:"Something went wrong"})
    }

})


app.listen(PORT, (req,res)=>{
    console.log(`App is running on port ${PORT}`)
})