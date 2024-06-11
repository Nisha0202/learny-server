const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');


const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.5cua0xk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const bcrypt = require('bcrypt');
const saltRounds = 10;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors());
app.use(express.json());

async function run() {
  try {
    // await client.connect();
    console.log("Successfully connected to MongoDB!");

    const database = client.db('learny');
    const sessionCollection = database.collection('session');
    const bookedSessionCollection = database.collection('bookedSession');
    const usersCollection = database.collection('userInfo');

    app.get('/api/session', async (req, res) => {
      try {
        const sessions = await sessionCollection.find().toArray();
        res.status(200).json(sessions);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    });

    app.get('/api/session/:id', async (req, res) => {
      try {
        const session = await sessionCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json(session);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      } finally {
        
      }
    });

    //booked
    app.post('/api/bookedSession', async (req, res) => {
      const { sessionId, userEmail, tutorEmail } = req.body;
      const session = await sessionCollection.findOne({ _id: new ObjectId(sessionId) });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      const bookedSession = {
        _id: new ObjectId(),
        sessionId,
        userEmail,
        tutorEmail,
        sessionDetails: session,
      };
      await bookedSessionCollection.insertOne(bookedSession);
      res.status(200).json({ message: 'Session booked successfully' });
    });


    //find booked session
    app.get('/api/bookedSession', async (req, res) => {
      const { userEmail } = req.query;
    
      try {
        const bookedSessions = await bookedSessionCollection.find({ userEmail }).toArray();
        res.status(200).json(bookedSessions);
      } catch (error) {
        console.error('Error fetching booked sessions:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    


    app.post('/api/users', async (req, res) => {
      const { email, pass, username, image, role } = req.body;
    
      // Check if the user is trying to register as an admin
      if (role === 'admin' && (email !== 'admin@gmail.com' || pass !== 'Admin')) {
        return res.status(400).json({ message: 'Cannot register as Admin' });
      }
      const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
    
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(pass, saltRounds);
    
        const user = { email, pass: hashedPassword, username, image, role };
        const result = await usersCollection.insertOne(user);
        res.status(200).json({ message: 'User created successfully', userId: result.insertedId });
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
      }
    });
    

    app.post('/api/login', async (req, res) => {
      const { email, pass } = req.body;
    
      try {
        // Find the user with the given email
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }
    
        // Check if the password is correct
        const validPassword = await bcrypt.compare(pass, user.pass);
        if (!validPassword) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }
    
        // Create a JWT token
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.SECRET_TOKEN, { expiresIn: '1h' });
    
        // Send the token to the client
        res.status(200).json({ message: 'Logged in successfully', token });
      } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: error.message });
      }
    });
    



  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server running')
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
})

