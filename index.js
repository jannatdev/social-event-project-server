import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';
import { createRemoteJWKSet, jwtVerify } from "jose";


const app = express();
const PORT = 8000;

app.use(cors())
  

app.use(express.json());

app.get("/test", (req, res) => {
  console.log("TEST ROUTE WORKING!");

  res.send("Express server is working");
});
export default app;





const client = new MongoClient(process.env.MONGODB_CLIENT_URI);



async function run() {
    try {
        await client.connect();
         console.log("MongoDB Connected Successfully!");
       
         const db = client.db("social-event")
          console.log("Database:", db.databaseName);

        const eventsCollection = db.collection("events")

   
   const joiningCollection = db.collection("joining")
   

  //  Verify token

  const authUrl = process.env.BETTER_AUTH_URL;

if (!authUrl) {
  throw new Error("BETTER_AUTH_URL is missing");
}


const JWKS = createRemoteJWKSet(
  new URL(`${authUrl}/api/auth/jwks`)
);

   const verifyToken=async(req,res,next)=>{
      
    
    try{
       const authHeader = req.headers.authorization;
    

    if (!authHeader || !authHeader.startsWith("Bearer ")){
      return res.status(401).send({message:"unauthorized"})
    }

    const token = authHeader.split(" ")[1];
   

    if (!token){
      return res.status(401).send({message:"Unauthorized"})
    }

     console.log("JWKS URL:", process.env.BETTER_AUTH_URL);

    
    
       const { payload } = await jwtVerify(token, JWKS);
       

    req.user = payload

    next()

    }catch (error) {
       console.error("JWT ERROR NAME:", error);
 
   
    return res.status(401).send({
      message: "Invalid or expired token"
    });
  }
  }
   

//  Events API

 



// Events API by email
app.get('/events/creator/:email',verifyToken,async(req,res)=>{

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
          
        try{
            const {id}=req.params
          
             
     if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid event ID",
      });

      
    } 

       const updateData = {
      title: req.body.title,
      description: req.body.description,
      eventType: req.body.eventType,
      thumbnailImageUrl: req.body.thumbnailImageUrl,
      location: req.body.location,
      eventDate: new Date(req.body.eventDate),
      updatedAt: new Date(),
    }

    if (isNaN(updateData.eventDate.getTime())) {
      return res.status(400).send({
        message: "Invalid event date",
      });

     }
        
        const result= await eventsCollection.updateOne(
          {_id:new ObjectId(id)},
          {$set:updateData},
           { returnDocument: "after" },
        )
           

            if (result.modifiedCount === 0) {
      return res.status(200).send({
        message: "No changes detected",
        result,
      });
    }

    res.status(200).send({
      message: "Event updated successfully",
      result,
    });

}catch (error) {
    console.error("Update event error:", error);

    res.status(500).send({
      message: "Failed to update event",
    });
  }
    })



    // Delete API

app.delete('/events/:id',async(req,res)=>{
    const {id} =req.params;
    const result = await eventsCollection.deleteOne({_id:new ObjectId(id)})
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
 

// Joining API

app.get('/events/joiningEvents/:email',verifyToken,async(req,res)=>{

    try{
        const {email} =req.params
       
        
    const result= await joiningCollection.find({
        joinedUserEmail:email}).sort({eventDate:1}).toArray();
        console.log("4. Joined events:", result.length);
     return res.status(200).send(result)

    }catch(error){
        console.error(error)
      return res.status(500).send({
            message:"Failed to get join Event!"
        })
    }
    
})

// Upcoming 6 Events

app.get('/Upcoming-events',async(req,res)=>{
    try{
        const currentDate = new Date()
        currentDate.setHours(0,0,0,0)
        const result = await eventsCollection.find(
            {eventDate:{$gte:currentDate}}).sort({eventDate:1}).limit(6).toArray();
            res.send(result)
    } catch(error){
        console.error(error)
          return res.status(500).send({
            message: "Failed to get upcoming events",
            error: error.message
        });
  
     
        }
    }

)



// Eevents Post

app.post('/events',async(req,res)=>{
  try{
    const eventData = req.body

    const newEvent={
      ...eventData,
    
      eventDate:new Date(eventData.eventDate)

    }
    const result = await eventsCollection.insertOne(newEvent)
    res.send(result)

  }catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Failed to create event",
      error: error.message
    });
  }
    
}
)

// All Events API

  app.get("/events", async (req, res) => {

    try{
       const currentDate = new Date()
        currentDate.setHours(0,0,0,0)
        const result = await eventsCollection.find(
            {eventDate:{$gte:currentDate}}).sort({eventDate:1}).toArray();
            res.send(result)

    }catch(error){
        console.error(error)
          return res.status(500).send({
            message: "Failed to get upcoming events",
            error: error.message
        });
  
     
        }
      
    });


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