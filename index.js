import express from 'express';

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const app = express();
const PORT = 8000;

app.use(express.json());




const client = new MongoClient(process.env.MONGODB_CLIENT_URI);



async function run() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
    


   
   const db = client.db("social-event")
   const eventsCollection = db.collection("events")


app.get('/events/:email',async(req,res)=>{
    const email = req.params.email
    const result = await eventsCollection.find({creatorEmail:email}).toArray()
    res.send(result)
})

app.post('/events',async(req,res)=>{
    const eventData = req.body
    const result = await eventsCollection.insertOne(eventData)
    res.send(result)
}
)

app.get("/events", async (req, res) => {
      const result = await eventsCollection.find().toArray();
      res.send(result);
    });

app.get('/', (req, res) => {
    console.log("Server is running Fine");
    res.send("Server is running Fine!");
});


app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    } catch (error){
    console.error(error);
  }
}
run()