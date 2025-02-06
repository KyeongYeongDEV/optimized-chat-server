const express = require("express");
const redis = require('redis');

const app = express();
const redisClient = redis.createClient({ url:'redis://localhost:6379' });
app.use(express.json());
app.use(express.urlencoded({ extended:false }));

redisClient.connect().then(()=> console.log("connected to Redis"));

app.post('/session', async(req,res)=> {
    const { userId, data } = req.body;
    await redisClient.set(`session${userId}`, JSON.stringify(data), {
        EX: 60 * 60 // 한시간 TTL
    });

    res.send('✅Session saved');
});

app.get('/session/:userId', async(req,res)=> {
    const userId = req.param.userId;
    const sessionData = await redisClient.get(`session:${userId}`);
    res.json(sessionData ? JSON.parse(sessionData) : { error : 'session not found'});
});

app.listen(8080, () => {
    console.log(`server is started http://localhost:8080`);
})