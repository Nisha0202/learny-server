const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');


const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
// const ObjectId = require('mongodb').ObjectId;
const { ObjectId } = require('mongodb');
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

    //collections
    const database = client.db('learny');
    const sessionCollection = database.collection('sessions');
    const bookedSessionCollection = database.collection('bookedSession');
    const usersCollection = database.collection('userInfo');
    const reviewsCollection = database.collection('reviews'); 
    const notesCollection = database.collection('notes'); 
    const materialsCollection = database.collection('materials');

    // Create a session
app.post('/api/session', async (req, res) => {
  const sessionData = req.body;
  try {
      await sessionCollection.insertOne(sessionData);
      res.status(200).json({ message: 'Session created successfully' });
  } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ message: 'Error creating session' });
  }
});

//get allsession
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


    //approved
  //  app.put('/api/sessions/:id', async (req, res) => {
  //     try {
  //         const session = await sessionCollection.findById(req.params.id);
  //         if (!session) {
  //             return res.status(404).send({ error: 'Session not found' });
  //         }
  
  //         session.status = req.body.status;
  //         session.registrationFee = req.body.registrationFee;
  
  //         await session.save();
  
  //         res.send(session);
  //     } catch (error) {
  //         console.error(error);
  //         res.status(500).send({ error: 'Internal Server Error' });
  //     }
  // });


  app.put('/api/sessions/:id', async (req, res) => {
    try {
        // Find the session document by its ID
        const session = await sessionCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!session) {
            return res.status(404).send({ error: 'Session not found' });
        }

        // Update the document with new data
        for (let key in req.body) {
            session[key] = req.body[key];
        }

        // If the session is rejected, update the rejection reason and feedback
        if (req.body.status === 'rejected') {
            session.rejectionReason = req.body.rejectionReason;
            session.feedback = req.body.feedback;
        }

        // If the session is approved, update the registration fee
        if (req.body.status === 'approved') {
            session.registrationFee = req.body.registrationFee;
        }

        // Save the updated session document
        await sessionCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: session });

        res.send(session);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
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
      if (role === 'admin' && (email !== 'admin@gmail.com' || pass !== 'Adminn')) {
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

    //get all user
    // app.get('/api/users', async (req, res) => {
    //   try {
    //     const users = await usersCollection.find({}).toArray();
    //     res.json(users);
    //   } catch (err) {
    //     console.error('Error fetching users:', err);
    //     res.status(500).send(err);
    //   }
    // });

    app.get('/api/users', async (req, res) => {
      const { search } = req.query;
      let query = {};
  
      if (search) {
          query = {
              $or: [
                  { username: new RegExp(search, 'i') },
                  { email: new RegExp(search, 'i') }
              ]
          };
      }
  
      try {
          const users = await usersCollection.find(query).toArray();
          res.json(users);
      } catch (err) {
          console.error('Error fetching users:', err);
          res.status(500).send(err);
      }
  });


    
    app.put('/api/users/:userId', async (req, res) => {
    
      const userId = new ObjectId(req.params.userId); 
      const { role } = req.body;
    
      try {
        const user = await usersCollection.findOneAndUpdate(
          { _id: userId },
          { $set: { role: role } },
          { new: true }
        );
        res.json(user);
      } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).send(err);
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

    app.get('/api/review/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const reviews = await reviewsCollection.find({ sessionId: id }).toArray();
        res.status(200).json(reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews' });
      }
    });
    

    //add review
    app.post('/api/review', async (req, res) => {
      const { sessionId, userEmail, userName, review, rating } = req.body;
      try {
          // Insert the new review into the database
          const result = await reviewsCollection.insertOne({ sessionId, userEmail, userName, review, rating });
          // Send a success response
          res.status(200).json({ message: 'Review submitted successfully', reviewId: result.insertedId });
      } catch (error) {
          // Send an error response
          console.error('Error submitting review:', error);
          res.status(500).json({ message: 'Error submitting review' });
      }
  });


  //create notes
  app.post('/api/notes', async (req, res) => {
    const { userEmail, title, description } = req.body;
    try {
        // Insert the new note into the database
        const result = await notesCollection.insertOne({ userEmail, title, description });
        // Send a success response
        res.status(200).json({ message: 'Note created successfully', noteId: result.insertedId });
    } catch (error) {
        // Send an error response
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Error creating note' });
    }
});



// Update a note
app.put('/api/notes/:id', async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;
  try {
      await notesCollection.updateOne({ _id: new ObjectId(id) }, { $set: { title, description } });
      res.status(200).json({ message: 'Note updated successfully' });
  } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).json({ message: 'Error updating note' });
  }
});


//fetch
app.get('/api/notes', async (req, res) => {
  const userEmail = req.query.userEmail;

  try {
    const notes = await notesCollection.find({ userEmail: userEmail }).toArray();
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await notesCollection.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ message: 'Error deleting note' });
  }
});



//teacher
app.get('/api/session/tutor/:tutorEmail', async (req, res) => {
  try {
    const { tutorEmail } = req.params; // Get the tutorEmail from the route parameters
    const sessions = await sessionCollection.find({ tutorEmail }).toArray();
    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/session/:id/request-approval', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionCollection.findOne({ _id: new ObjectId(id) });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    await sessionCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'pending' } });
    res.status(200).json({ message: 'Approval request sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//materials
app.post('/api/materials', async (req, res) => {
  try {
    const { title, sessionId, tutorEmail, image, link } = req.body;

    // Create the material object
    const material = {
      title,
      sessionId,
      tutorEmail,
      image,
      link,
    };

   await materialsCollection.insertOne(material);

    res.status(200).json({ message: 'Material uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload material' });
  }
});

app.get('/api/materials', async (req, res) => {
  const materials = await materialsCollection.find().toArray();
  res.status(200).json(materials);
});

app.put('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  const updatedMaterial = req.body;
  await materialsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedMaterial });
  res.status(200).json({ message: 'Material updated successfully' });
});

app.delete('/api/materials/:id', async (req, res) => {
  const { id } = req.params;
  await materialsCollection.deleteOne({ _id: new ObjectId(id) });
  res.status(200).json({ message: 'Material deleted successfully' });
});

app.get('/api/materials/:tutorEmail', async (req, res) => {
  const { tutorEmail } = req.params;
  const materials = await materialsCollection.find({ tutorEmail }).toArray();
  res.status(200).json(materials);
});


app.get('/api/material/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    console.log(`Fetching materials for sessionId: ${sessionId}`); // Add logging
    const materials = await materialsCollection.find({ sessionId: sessionId }).toArray();
    res.status(200).json(materials);
  } catch (err) {
    console.error(`Error fetching materials for sessionId: ${sessionId}`, err); // Add logging
    res.status(500).send(err);
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

