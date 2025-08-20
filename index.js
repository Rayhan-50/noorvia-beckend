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
   const teamCollection = client.db("noorvia").collection("teamMembers");
   const performersCollection = client.db("noorvia").collection("performers");
   const contactCollection = client.db("noorvia").collection("contacts");
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
   
// add team member
// ---------- Public: list all active members (sorted) ----------
app.get('/team', async (_req, res) => {
  try {
    const result = await teamCollection
      .find({ active: { $ne: false } })
      .sort({ order: 1, name: 1 })
      .toArray();
    res.send(result);
  } catch (e) {
    res.status(500).send({ message: 'Failed to fetch team', error: e?.message });
  }
});

// ---------- Public: get one member by id ----------
app.get('/team/:id', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const doc = await teamCollection.findOne({ _id });
    if (!doc) return res.status(404).send({ message: 'Member not found' });
    res.send(doc);
  } catch (e) {
    res.status(500).send({ message: 'Failed to fetch member', error: e?.message });
  }
});

// ---------- Admin: create member ----------
app.post('/team',  async (req, res) => {
  try {
    const {
      name, position, bio,
      expertise = [],
      image = '',
      order = 999,
      active = true,
      socials = {}
    } = req.body || {};

    if (!name || !position || !bio) {
      return res.status(400).send({ message: 'name, position and bio are required' });
    }

    const payload = {
      name: String(name).trim(),
      position: String(position).trim(),
      bio: String(bio).trim(),
      expertise: Array.isArray(expertise) ? expertise.map(s => String(s).trim()).filter(Boolean) : [],
      image: String(image || ''),
      order: Number(order) || 999,
      active: Boolean(active),
      socials: {
        linkedin: socials?.linkedin || '',
        twitter: socials?.twitter || '',
        website: socials?.website || ''
      },
      createdAt: new Date()
    };

    if (!payload.expertise.length) {
      return res.status(400).send({ message: 'At least one expertise is required' });
    }

    const result = await teamCollection.insertOne(payload);
    res.send({ insertedId: result.insertedId });
  } catch (e) {
    res.status(500).send({ message: 'Failed to create member', error: e?.message });
  }
});

// ---------- Admin: update member ----------
app.patch('/team/:id',  async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const up = req.body || {};
    // sanitize a bit
    if (up.name) up.name = String(up.name).trim();
    if (up.position) up.position = String(up.position).trim();
    if (up.bio) up.bio = String(up.bio).trim();
    if (Array.isArray(up.expertise)) {
      up.expertise = up.expertise.map(s => String(s).trim()).filter(Boolean);
    }
    if (typeof up.order !== 'undefined') up.order = Number(up.order) || 999;
    if (typeof up.active !== 'undefined') up.active = Boolean(up.active);
    if (up.socials) {
      up.socials = {
        linkedin: up.socials?.linkedin || '',
        twitter: up.socials?.twitter || '',
        website: up.socials?.website || ''
      };
    }

    const result = await teamCollection.updateOne(
      { _id },
      { $set: { ...up, updatedAt: new Date() } }
    );

    res.send(result);
  } catch (e) {
    res.status(500).send({ message: 'Failed to update member', error: e?.message });
  }
});

// ---------- Admin: delete member ----------
app.delete('/team/:id',  async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const result = await teamCollection.deleteOne({ _id });
    res.send(result);
  } catch (e) {
    res.status(500).send({ message: 'Failed to delete member', error: e?.message });
  }
});

    // Performers related API

    // ---------- Public: submit performer application ----------
// app.post('/performers', async (req, res) => {
//   try {
//     const form = req.body || {};

//     // Basic validation
//     if (!form.name || !form.email || !form.designation) {
//       return res.status(400).send({ message: 'Name, email, and designation are required' });
//     }

//     // Sanitize / normalize
//     const payload = {
//       name: String(form.name).trim(),
//       fatherName: String(form.fatherName || '').trim(),
//       motherName: String(form.motherName || '').trim(),
//       nidNumber: String(form.nidNumber || '').trim(),
//       designation: String(form.designation || '').trim(),
//       company: String(form.company || '').trim(),
//       cellPhone: String(form.cellPhone || '').trim(),
//       whatsappNumber: String(form.whatsappNumber || '').trim(),
//       email: String(form.email).toLowerCase().trim(),
//       presentAddress: String(form.presentAddress || '').trim(),
//       permanentAddress: String(form.permanentAddress || '').trim(),
//       companyAddress: String(form.companyAddress || '').trim(),
//       membershipCategory: Array.isArray(form.membershipCategory) ? form.membershipCategory : [],
//       productServiceTypes: Array.isArray(form.productServiceTypes) ? form.productServiceTypes.filter(Boolean) : [],
//       networkCompanies: Array.isArray(form.networkCompanies) ? form.networkCompanies : [],
//       createdAt: new Date(),
//       status: 'pending' // you can track review status
//     };

//     const result = await performersCollection.insertOne(payload);
//     res.send({ insertedId: result.insertedId });
//   } catch (e) {
//     res.status(500).send({ message: 'Failed to submit performer', error: e?.message });
//   }
// });

// // ---------- Admin: get all performer applications ----------
// app.get('/performers', verifyToken, verifyAdmin, async (_req, res) => {
//   try {
//     const result = await performersCollection.find().sort({ createdAt: -1 }).toArray();
//     res.send(result);
//   } catch (e) {
//     res.status(500).send({ message: 'Failed to fetch performers', error: e?.message });
//   }
// });
// ===================== Performers related API =====================

// ---------- Public: submit performer application ----------
app.post('/performers', async (req, res) => {
  try {
    const form = req.body || {};

    // Basic validation
    if (!form.name || !form.email || !form.designation) {
      return res.status(400).send({ message: 'Name, email, and designation are required' });
    }

    // Sanitize / normalize
    const payload = {
      name: String(form.name).trim(),
      fatherName: String(form.fatherName || '').trim(),
      motherName: String(form.motherName || '').trim(),
      nidNumber: String(form.nidNumber || '').trim(),
      designation: String(form.designation || '').trim(),
      company: String(form.company || '').trim(),
      cellPhone: String(form.cellPhone || '').trim(),
      whatsappNumber: String(form.whatsappNumber || '').trim(),
      email: String(form.email).toLowerCase().trim(),
      presentAddress: String(form.presentAddress || '').trim(),
      permanentAddress: String(form.permanentAddress || '').trim(),
      companyAddress: String(form.companyAddress || '').trim(),
      membershipCategory: Array.isArray(form.membershipCategory) ? form.membershipCategory.filter(Boolean) : [],
      productServiceTypes: Array.isArray(form.productServiceTypes) ? form.productServiceTypes.filter(Boolean) : [],
      networkCompanies: Array.isArray(form.networkCompanies) ? form.networkCompanies : [],
      createdAt: new Date(),
      status: 'pending' // optional: track review status
    };

    const result = await performersCollection.insertOne(payload);
    res.send({ insertedId: result.insertedId });
  } catch (e) {
    res.status(500).send({ message: 'Failed to submit performer', error: e?.message });
  }
});

// ---------- Admin: get all performer applications ----------
app.get('/performers', verifyToken, verifyAdmin, async (_req, res) => {
  try {
    const result = await performersCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.send(result);
  } catch (e) {
    res.status(500).send({ message: 'Failed to fetch performers', error: e?.message });
  }
});

// ---------- Admin: get one performer by id ----------
app.get('/performers/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const doc = await performersCollection.findOne({ _id });
    if (!doc) return res.status(404).send({ message: 'Performer not found' });
    res.send(doc);
  } catch (e) {
    res.status(500).send({ message: 'Failed to fetch performer', error: e?.message });
  }
});

// ---------- Admin: update performer ----------
app.patch('/performers/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const up = req.body || {};

    // sanitize a bit
    const $set = {};
    const setIf = (k, v) => { if (typeof v !== 'undefined') $set[k] = v; };

    if (typeof up.name !== 'undefined') setIf('name', String(up.name).trim());
    if (typeof up.fatherName !== 'undefined') setIf('fatherName', String(up.fatherName).trim());
    if (typeof up.motherName !== 'undefined') setIf('motherName', String(up.motherName).trim());
    if (typeof up.nidNumber !== 'undefined') setIf('nidNumber', String(up.nidNumber).trim());
    if (typeof up.designation !== 'undefined') setIf('designation', String(up.designation).trim());
    if (typeof up.company !== 'undefined') setIf('company', String(up.company).trim());
    if (typeof up.cellPhone !== 'undefined') setIf('cellPhone', String(up.cellPhone).trim());
    if (typeof up.whatsappNumber !== 'undefined') setIf('whatsappNumber', String(up.whatsappNumber).trim());
    if (typeof up.email !== 'undefined') setIf('email', String(up.email).toLowerCase().trim());
    if (typeof up.presentAddress !== 'undefined') setIf('presentAddress', String(up.presentAddress).trim());
    if (typeof up.permanentAddress !== 'undefined') setIf('permanentAddress', String(up.permanentAddress).trim());
    if (typeof up.companyAddress !== 'undefined') setIf('companyAddress', String(up.companyAddress).trim());
    if (Array.isArray(up.membershipCategory)) setIf('membershipCategory', up.membershipCategory.filter(Boolean));
    if (Array.isArray(up.productServiceTypes)) setIf('productServiceTypes', up.productServiceTypes.filter(Boolean));
    if (Array.isArray(up.networkCompanies)) setIf('networkCompanies', up.networkCompanies);
    if (typeof up.status !== 'undefined') setIf('status', String(up.status).trim());

    $set.updatedAt = new Date();

    const result = await performersCollection.updateOne(
      { _id },
      { $set }
    );

    res.send(result);
  } catch (e) {
    res.status(500).send({ message: 'Failed to update performer', error: e?.message });
  }
});

// ---------- Admin: delete performer ----------
app.delete('/performers/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const result = await performersCollection.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Performer not found' });
    }
    res.send(result);
  } catch (e) {
    res.status(500).send({ message: 'Failed to delete performer', error: e?.message });
  }
});

// ---------- Public: submit contact form ----------

app.post('/contacts', async (req, res) => {
  try {
    const form = req.body || {};
    // Basic validation
    if (!form.name || !form.email || !form.subject || !form.message) {
      return res.status(400).send({ message: 'Name, email, subject, and message are required' });
    }
    // Sanitize / normalize
    const payload = {
      name: String(form.name).trim(),
      email: String(form.email).toLowerCase().trim(),
      subject: String(form.subject).trim(),
      message: String(form.message).trim(),
      createdAt: new Date(),
    };
    const result = await contactCollection.insertOne(payload);
    res.send({ insertedId: result.insertedId, message: 'Contact form submitted successfully' });
  } catch (e) {
    res.status(500).send({ message: 'Failed to submit contact form', error: e?.message });
  }
});

// Get all contact submissions (admin-only)
    app.get('/contacts', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const result = await contactCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(result);
      } catch (e) {
        console.error('Error fetching contacts:', e);
        res.status(500).send({ message: 'Failed to fetch contacts' });
      }
    });

    // Delete a contact submission (admin-only)
    app.delete('/contacts/:id', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const _id = new ObjectId(req.params.id);
        const result = await contactCollection.deleteOne({ _id });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Contact not found' });
        }
        res.send({ message: 'Contact deleted successfully' });
      } catch (e) {
        console.error('Error deleting contact:', e);
        res.status(500).send({ message: 'Failed to delete contact' });
      }
    });
 
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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