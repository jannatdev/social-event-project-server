import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';

const app = express();
const PORT = 8000;

app.use(cors())

app.use(express.json());




const client = new MongoClient(process.env.MONGODB_CLIENT_URI);



async function run() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
    


   
   const db = client.db("social-event")
   const eventsCollection = db.collection("events")

   
   const joiningCollection = db.collection("joining")


//  Events API

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

// Events API by email
app.get('/events/creator/:email',async(req,res)=>{

    try{
        const email = req.params.email
       
        
    const result = await eventsCollection.find({createdByEmail:email}).toArray()
  
  
      return res.status(200).send(result)
    }catch(error){
        console.error(error)
         return res.status(500).send({
        message:"Failed to fetch creator events"
    })
}
      
    })


    // Update Api


    app.patch('/events/:id', async(req,res)=>{
        const {id}=req.params
        const updateData = req.body
        const result= await eventsCollection.updateOne(
          {_id:new ObjectId(id)},
          {$set:updateData},
        )
        res.send(result)
    })
    
   

//Single Event API 


 app.get("/events/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            message: "Invalid event ID",
          });
        }

        const result = await eventsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({
            message: "Event not found",
          });
        }

        res.status(200).send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          message: "Failed to fetch event",
        });
      }
    });

    // Joining Events API

  app.post('/events/join',async(req,res)=>{

    try{
         const joiningData =req.body;
       const exitJoining = await joiningCollection.findOne({
         eventId: joiningData.eventId,
      joinedUserEmail: joiningData.joinedUserEmail
    })

    if(exitJoining){
        return res.status(400).send({
            message:"This event is already booked"
        })

    

    }
    const result =await joiningCollection.insertOne({
        ...joiningData,
        joinedAt: new Date()
    })
     return res.status(201).send({
      success: true,
      message: "Successfully joined the event",
      insertedId: result.insertedId
    });
   


    
    }catch(error){
        console.error(error)
        return res.status(500).send({
      message: "Failed to join event"
    });
    }

    
  }
)  




app.get('/events/joiningEvents/:email',async(req,res)=>{

    try{
        const {email} =req.params
        
    const result= await joiningCollection.find({
        joinedUserEmail:email}).sort({eventDate:1}).toArray();
     return res.status(200).send(result)

    }catch(error){
        console.error(error)
      return res.status(500).send({
            message:"Failed to get join Event!"
        })
    }
    
})


app.get('/', (req, res) => {
    console.log("Server is running Fine");
     res.send("Server is running Fine!");
});


app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  
}catch (error){
    console.error(error);
}
}
run()