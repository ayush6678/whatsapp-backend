//import
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
import { Timestamp } from "mongodb";
//app config
const app = express();
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1632547",
    key: "274ec5f96d0c3ca2d989",
    secret: "45c2c77c7b252a4bf598",
    cluster: "ap2",
    useTLS: true
});


//middleware
app.use(express.json())
app.use(cors())
//DB config
const connection_url = "mongodb+srv://ayush:inqPPaoV5n4fCYF9@cluster0.miirdrv.mongodb.net/?retryWrites=true&w=majority"

mongoose.set('strictQuery', false);
mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
//???

const db = mongoose.connection

db.once("open", () => {
    console.log("DB Connected")

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()
    changeStream.on("change", (change) => {
        console.log(change)

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                })
        }
        else {
            console.log("error triggering pusher")
        }
    })
})



//api routes
app.get("/", (req, res) => res.status(200).send("Hello world!"))

app.get('/messages/sync', (req, res) => {
    Messages.find()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage)
        .then(dbMessage => {
            res.status(201).send(`new message created:${dbMessage}`)
        })
        .catch(error => {
            res.status(500).send(error)
        });
    // Messages.create(dbMessage, (err, data) => {
    //     if (err) {
    //         res.status(500).send(err)
    //     }
    //     else {
    //         res.status(201).send(`new message created: \n ${data}`)
    //     }
    // })
})




//listen
app.listen(port, () => console.log(`Listening on local host: ${port}`))