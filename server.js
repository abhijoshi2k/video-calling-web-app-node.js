const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {v4: uuidv4} = require('uuid');
const {ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server, {
	debug: true
})

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/peerjs', peerServer);

app.get('/:room',(req,res) => {
	res.render('room', {roomId: req.params.room});
})

app.get('/', (req,res) => {
	res.redirect(`/${uuidv4()}`);
})

io.on('connection', socket => {
	socket.on('join-room', (roomId,userId,joiner) => {
		socket.join(roomId);
		socket.to(roomId).broadcast.emit('user-connected',userId,joiner);

		socket.on('message', (message, sender) => {
			io.to(roomId).emit('createMessage', message, sender)
		})

		socket.on('peerDis', (disId,disName) => {
			socket.to(roomId).broadcast.emit('peerGone',disId,disName);
		})

		socket.on('addMe', (uId, uName, admAdd) => {
			socket.to(roomId).broadcast.emit('addUser',uId,uName,admAdd);
		})

		socket.on('remReq', (remId, aName) => {
			socket.to(roomId).broadcast.emit('remAck', remId, aName);
		})

		socket.on('admReq', (admId, aName) => {
			socket.to(roomId).broadcast.emit('admAck', admId, aName);
		})
	})
})


server.listen(process.env.PORT || 3030);