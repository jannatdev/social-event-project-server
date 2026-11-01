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


app.get('/events/creator/:email',async(req,res)=>{

    try{
        const email = req.params.email
       
     const allEvents = await eventsCollection.find({}).toArray();

    

        
    const result = await eventsCollection.find({createdByEmail:email}).toArray()
  
  
      return res.status(200).send(result)
    }catch(error){
        console.error(error)
         return res.status(500).send({
        message:"Failed to fetch creator events"
    })
}
      
    })
    
   




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

    


    

    

app.post('/events/:id/join',async(req,res)=>{
    try{
        const {id}= req.params;
        const {userId,userName,userEmail} = req.body;

        if(!ObjectId.isValid(id)){
            return res.status(400).send({
                message:"Invalid Id"
            })

   
    }
     if(!userId || !userName || !userEmail){
        return res.status(401).send({
            message:"Join the Event"
        })
        
        
    }
    const event = await eventsCollection.findOne({_id:new ObjectId(id)})

    if (!event){
        return res.status(400).send({
            message:"Event not Found"
        })
    }
     const joiner = {
      eventId: id,
          eventTitle: event.title,
          eventType: event.eventType,
          eventDate: event.eventDate,
          thumbnail: event.thumbnailImageUrl,
          location: event.location,

          userId:userId,
          userName: userName,
          userEmail: userEmail,

          joinedAt: new Date(),
    };

    const result = await joiningCollection.insertOne(joiner)

    res.status(201).send({
        success: true,
          message: "Successfully joined the event",
          insertedId: result.insertedId,
    })

    }catch(error){
        console.error("joined event error",error)
    }
       return res.status(500).send({
        message:"Failed to join event."
    })
    
}
)

app.get('/my-joined-events/:userId',async(req,res)=>{

    try{
        const {userId} =req.params
        console.log("userid",userId)
    const result= await joiningCollection.find({userId:userId}).toArray();
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