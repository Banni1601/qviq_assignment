
const usersData = require("../model/users.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const QRCode = require("qrcode");
const dotenv = require("dotenv");


dotenv.config();
const PORT = process.env.PORT

//API for SignUp
const signUp = async (req, res) => {
  try {
    //get all data from the body
    const { name, email, phoneNo, gender, profilePhoto, coverPhoto, country , bio, password } = req.body;
    //all data should exists????
    if (!( name&& email&& phoneNo&& gender&&profilePhoto&& coverPhoto&& country && bio&& password)) {
      res.status(404).json({ message: "All fields are Required" });
      return res.status;
    }

    //check if user is already exists - email
    const existingUser = await usersData.findOne({ email });
    if (existingUser) {
      res.status(405).json({ message: " User already exist with this mail" });
      return res.status;
    } else {
      //encrypt the password
      const myEncryptedPassword = await bcrypt.hash(password, 10);
      // save the user in DB
      const newUser = await new usersData({
        name: name,
        email: email,
        phoneNo:phoneNo,
        gender:gender,
        profilePhoto:profilePhoto,
        coverPhoto:coverPhoto,
        country:country,
        bio:bio,
        password: myEncryptedPassword
      });
      //generate a token for user and send it
      const JWT_SECRET = crypto.randomBytes(32).toString("hex");
      const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
        expiresIn: "2h"
      });
      newUser.token = token;

       // Generate a unique URL for the user's profile
       const profileUrl = `https://org-server-br1g.onrender.com:${PORT}/profile/${email}`;
      const qrCodeData = await QRCode.toDataURL(profileUrl);
      newUser.qrCode = qrCodeData;
      newUser.qrCodeUrl = qrCodeData;
      

      //save the user data
      await newUser.save();
      res.status(200).json(newUser);
      return res.status;
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



//API for LogIn
const login = async (req, res) => {
  try {
    //get all data from frontend
    const { email, password } = req.body;
    //validation
    if (!(email && password)) {
      res.status(400).json({ message: "Mail and Password are Required" });
      
    } else {
      //find the user in DB
      const user = await usersData.findOne({ email });

      //if user is not there
      if (!user) {
        res.status(404).json({ message: "no user found" });
        
      } else if (user && (await bcrypt.compare(password, user.password))) {
        //if user mail and password is matched then generate the token
        const JWT_SECRET = crypto.randomBytes(32).toString("hex");
        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
          expiresIn: "2h"
        });
        user.token = token;

        //cookie section
        const options = {
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          httpOnly: true
        };

        res.status(200).cookie("token", token, options).json(user);
        
      } else {
        res.status(405).json({ message: "password is incorrect" });
        
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
   
  }
};

//API for Getting all Users Data from Database
const getAllUsersData = async (req, res) => {
  try {
   // const id = req.params.id;
    let fetchedData = await usersData.find();
    if (!fetchedData) {
      return res.status(404).json({ message: "user data was not found" });
    }

    res.status(200).json(fetchedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//API for Fetch the Specific User Data by using the Id
const getOneUsersData = async (req, res) => {
  try {
    const id = req.params.id;
    const fetchedData = await usersData.findById(id);
    if (!fetchedData) {
      return res.status(404).json({ message: "data was not found" });
    }
    res.status(200).json(fetchedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//API for update the specific User Data

const updateUserData = async (req, res) => {
  try {
    const id = req.params.id;  
    const fetchedData = await usersData.findById(id);
    if (!fetchedData) {
      return res.status(401).json({ message: "user was not found" });
    }

  
    //let {name,email,phoneNo,gender,country, bio} = fetchedData;
    const updatedUserData = await usersData.findByIdAndUpdate(id, req.body, {
      new: true
    });

    res.status(200).json(updatedUserData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//API for Delete the specific User Data
 const deleteUserData = async (req, res) => {
  try {
    const id = req.params.id;
    let fetchedData = await usersData.findByIdAndDelete(id);
    if (!fetchedData) {
      return res.status(404).json({ message: "user was not found" });
    }
    res.status(200).json({message:`User: ${id} Data was Successfully Deleted `});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signUp, login,getAllUsersData,getOneUsersData,updateUserData,deleteUserData};



