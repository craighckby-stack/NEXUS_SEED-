Here's an optimized version of the provided code:

```javascript
// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const lodash = require('lodash');
const moment = require('moment');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const redis = require('redis');
const session = require('express-session');
const passport = require('passport');
const socketio = require('socket.io');
const cheerio = require('cheerio');
const request = require('request');
const async = require('async');
const validator = require('validator');

// Create Express app
const app = express();
const http = require('http').createServer(app);
const io = socketio(http);

// Connect to MongoDB
mongoose.connect('mongodb://admin:password123@localhost:27017/mydb?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// Define Mongoose models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  age: Number,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  role: String,
  permissions: [String],
  avatar: String,
  bio: String,
  socialLinks: {
    twitter: String,
    facebook: String,
    linkedin: String,
    github: String
  },
  settings: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: true },
    theme: String,
    language: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationToken: String,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [String],
  category: String,
  status: { type: String, default: 'draft' },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: Date,
  featured: { type: Boolean, default: false },
  slug: { type: String, required: true, unique: true }
});

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  likes: { type: Number, default: 0 }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Category = mongoose.model('Category', categorySchema);

// Configure Express app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: 'redis123'
});

const upload = multer({ dest: 'uploads/' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myapp@gmail.com',
    pass: 'mypassword123'
  }
});

// Define routes
app.post('/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    if (!username || !password || !email) {
      return res.status(400).send('Missing required fields');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      createdAt: new Date(),
      isAdmin: false,
      isActive: true,
      isVerified: false,
      verificationToken,
      loginAttempts: 0
    });

    await newUser.save();

    const mailOptions = {
      from: 'myapp@gmail.com',
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="http://localhost:3000/verify/${verificationToken}">here</a> to verify</p>`
    };

    await transporter.sendMail(mailOptions);

    return res.json({ message: 'User created', userId: newUser._id });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error creating user');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.status(401).send('Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).send('Account locked');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 3600000;
      }
      await user.save();
      return res.status(401).send('Invalid credentials');
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      'super-secret-key-do-not-share-123',
      { expiresIn: '24h' }
    );

    req.session.userId = user._id;

    return res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error logging in');
  }
});

// ... (rest of the routes)

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  } else if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  } else {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  return res.status(404).send('Not found');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

module.exports = app;