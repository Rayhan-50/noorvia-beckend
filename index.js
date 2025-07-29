// const express = require('express');
// const app = express();
// const cors = require('cors');
// require('dotenv').config()
// const port = process.env.PORT || 5000;

// //middleware
// app.use(cors());
// app.use(express.json());
// app.get('/', (req, res) => {
//     res.send('boss is sitting')
// })
// // mongodb+srv://<db_username>:<db_password>@cluster0.rxvwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// app.listen(port, () => {
//     console.log(`Bistro boss is sitting on port ${port}`)
// })

// // DB_USER=noorvia
// // DB_PASS=cD4RCWKJKfamV4hD



const express = require('express');
const app = express();
const cors = require('cors');
const jwt =require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;


// Middleware options
const corsOptions = {
  origin: [process.env.CLIENT_ADDRESS, process.env.DEV_CLIENT],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  withCredentials: true,
};
// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// MongoDB connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rxvwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const userCollection = client.db("noorvia").collection("users");
   

    // userrelated api
app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const ressult =await userCollection.insertOne(user);
      res.send(ressult);
    });

    // JWT related API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
      res.send({ token });
    });

    // Middleware for token verification
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Middleware for admin verification
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    };



    


 

    // User management APIs
    app.get('/users', verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      const admin = user?.role === 'admin';
      res.send({ admin });
    });

 
   

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: { role: 'admin' } };
      const result = await userCollection.updateOne(filter, update);
      res.send(result);
    });

 
   
 
   

    
 

    app.put('/users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const update = req.body;
      const result = await userCollection.updateOne({ email }, { $set: update });
      res.send(result);
    });
   

 
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Do not close client if keeping server running
  }
}

run().catch(console.dir);

// Root route
app.get('/', (req, res) => {
  res.send('noorview is sitting');
});

// Start server
app.listen(port, () => {
  console.log(`noorview is sitting on port ${port}`);
});