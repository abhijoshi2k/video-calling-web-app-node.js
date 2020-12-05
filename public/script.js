var socket = io('/');
let admin = 1;

id_arr = [];
name_arr = [];
adm_arr = [];

const name = prompt('Please Enter Your Name');

if(typeof name !=='string' || name == "")
{
	location.reload();
}

var myId;

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

var peer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: '443'
})

//port: 3030 for running locally and 443 on heroku

let myVideoStream
navigator.mediaDevices.getUserMedia({
	audio: true,
	video: { facingMode: "user" }
}).then(stream => {

	myVideoStream = stream;
	addVideoStream(myVideo, stream, name, myId);

	peer.on('call', call => {
		
		let already = document.getElementById(call.peer);
		if(already == null)
		{
			call.answer(stream);
			admin = 0;
			adm_arr[0] = 0;
			participant();
			socket.emit('addMe', myId, name, admin);
			let video = document.createElement('video');
			video.setAttribute('id', call.peer)
			let callerName = name_arr[id_arr.indexOf(call.peer)];

			call.on('stream', userVideoStream => {

				if(callerName === undefined)
				{
					setTimeout(function() {
						callerName = name_arr[id_arr.indexOf(call.peer)];
						addVideoStream(video,userVideoStream,callerName,call.peer)
					}, 3000);
				}
				else
				{
					addVideoStream(video,userVideoStream,callerName,call.peer);
				}
				
			})
		}
		
	})

	

	socket.on('user-connected', (userId,joiner) => {
		setTimeout(function(){
			connectToNewUser(userId, stream, joiner);
		}, 1000)
	})

	let text = $('input');

	$('html').keydown((e) => {
		if(e.which == 13 && text.val().length !== 0)
		{
			socket.emit('message', text.val(), name);
			text.val('');
		}
	});

	socket.on('createMessage', (message, sender) => {
		$('.messages').append('<li class="message"><b>'+sender+'</b><br>'+message+'</li>');
		scrollToBottom();
	});

	window.onbeforeunload = function() {
		socket.emit('peerDis', myId, name);
		peer.destroy();
	}

	peer.on('close', () => {
		socket.emit('peerDis', myId, name);
		peer.destroy();
	})

	peer.on('disconnected', () => {
		peer.reconnect();
	})

	socket.on('peerGone', (peerId, disName) => {
		if(document.getElementById(peerId) != null)
		{
			document.getElementById(peerId).remove();

			$('.messages').append('<small><li class="message py-1"><i>'+disName+' left!</i></li></small>');
			scrollToBottom();
			arrangeVideo();

			let index = id_arr.indexOf(peerId);

			if (index > -1) {
				id_arr.splice(index, 1);
				name_arr.splice(index, 1);
				adm_arr.splice(index, 1);
			}
			participant();
		}
		
	})

})

peer.on('open',id => {
	myId = id;
	id_arr.push(myId);
	name_arr.push(name);
	adm_arr.push(1);
	participant();
	socket.emit('join-room',ROOM_ID,id,name);
})

socket.on('addUser',(uId, uName, admAdd) => {
	if(!id_arr.includes(uId))
	{
		id_arr.push(uId);
		name_arr.push(uName);
		adm_arr.push(admAdd);
		participant();
	}
	
})


const connectToNewUser = (userId, stream, joiner) => {

	const call = peer.call(userId, stream);
	socket.emit('addMe', myId, name, admin);
	let video = document.createElement('video');
	
	if(joiner !== null)
	{
		$('.messages').append('<small><li class="message py-1"><i>'+joiner+' has joined!</i></li></small>');
		scrollToBottom();
	}
	call.on('stream', userVideoStream => {
		addVideoStream(video,userVideoStream,joiner,userId);
	})
}

const checkName = () => {
	var checkDiv = $('.videoDiv');

	for(var j=0; j<checkDiv.length; j++)
	{
		checkDiv[j].getElementsByTagName('div')[0].innerHTML = name_arr[id_arr.indexOf(checkDiv[j].getAttribute('id'))];
	}
}

const flexChange = (flexId,noFlexId) => {

	if(window.innerWidth>712)
	{
		document.getElementById(flexId).style.display = 'flex';
		document.getElementById(noFlexId).style.display = 'none';
	}
	else if(window.innerWidth>575)
	{
		if(document.getElementById(flexId).style.left == '100%' || document.getElementById(flexId).style.left == "")
		{
			document.getElementById(flexId).style.display = 'flex';
			document.getElementById(flexId).style.left = '60%';
			document.getElementById(noFlexId).style.left = '100%';
		}
		else
		{
			document.getElementById(flexId).style.left = '100%';
			document.getElementById(noFlexId).style.left = '100%';
		}
	}
	else
	{
		if(document.getElementById(flexId).style.left == '100%' || document.getElementById(flexId).style.left == "")
		{
			document.getElementById(flexId).style.display = 'flex';
			document.getElementById(flexId).style.left = '0%';
			document.getElementById(noFlexId).style.left = '100%';
		}
		else
		{
			document.getElementById(flexId).style.left = '100%';
			document.getElementById(noFlexId).style.left = '100%';
		}
	}
}

socket.on('remAck', (remId, aName) => {

	if(myId == remId)
	{
		peer.destroy();
		socket.disconnect();
		alert('You have been removed by '+aName);
		location.replace('/');
	}

})

const leaveMeet = () => {
	peer.destroy();
	socket.disconnect();
	location.replace('/');
}

const removeUser = (remId) => {

	if(admin == 1)
	{
		socket.emit('remReq', remId, name);
	}
	else
	{
		location.reload();
	}
}

socket.on('admAck', (admId, aName) => {

	if(myId == admId)
	{
		admin = 1;
	}

	adm_arr[id_arr.indexOf(admId)] = 1;
	
	participant();

	$('.messages').append('<small><li class="message py-1"><i>'+aName+' made '+name_arr[id_arr.indexOf(admId)]+' admin</i></li></small>');
	scrollToBottom();

})

const makeAdmin = (admId) => {

	if(admin == 1)
	{
		socket.emit('admReq', admId, name);
		adm_arr[id_arr.indexOf(admId)] = 1;
		participant();
	}
	else
	{
		location.reload();
	}
}

const chName = () => {
	var vDiv = document.getElementsByClassName('videoDiv');

	for(var l=0; l<vDiv.length; l++)
	{
		if(vDiv[l].getElementsByTagName('div')[0].innerHTML == 'undefined')
		{
			vDiv[l].getElementsByTagName('div')[0].innerHTML = name
		}
	}
}

const participant = () => {

	document.getElementsByClassName('participants')[0].innerHTML = '';

	for(var k=0; k<name_arr.length; k++)
	{
		if(admin == 1)
		{
			if(myId != id_arr[k])
			{
				let temp = '<li class="py-2">'+name_arr[k]+'<br><small style="cursor: pointer; color: #eb5348;" onclick="removeUser(\''+id_arr[k]+'\')">Remove</small>';
				if(adm_arr[k] == 1)
				{
					temp += '</li>';
				}
				else
				{
					temp += '<br><small style="cursor: pointer; color: #eb5348;" onclick="makeAdmin(\''+id_arr[k]+'\')">Make Admin</small></li>'
				}
				$('.participants').append(temp);
			}
			else
			{
				$('.participants').append('<li class="py-2">'+name_arr[k]+'</li>');
			}
		}
		else
		{
			$('.participants').append('<li class="py-2">'+name_arr[k]+'</li>');
		}
	}

	if($('.participants')[0].getElementsByTagName('li').length>1 && $('.participants')[0].getElementsByTagName('li')[0].innerHTML == $('.participants')[0].getElementsByTagName('li')[1].innerHTML)
	{
		participant();
	}

	document.getElementsByClassName('videoDiv')[0].setAttribute('id', myId);
}

const addVideoStream = (video,stream,joiner,userId) => {

	let videoDiv = document.createElement('div');
	videoDiv.style.position = 'relative';
	videoDiv.setAttribute('id', userId);
	videoDiv.setAttribute('class', 'videoDiv');
	let videoName = document.createElement('div');
	videoName.style.position = 'absolute';
	videoName.style.right = '1px';
	videoName.style.bottom = '1px';
	videoName.style.padding = '10px';
	videoName.style.background = 'rgba(0,0,0,0.75)';
	videoName.style.color = '#fff';
	videoName.innerHTML = joiner;
	

	video.srcObject = stream;
	video.onloadedmetadata = () => {
		video.play();
	}

	while(document.getElementById(userId) != null)
	{
		document.getElementById(userId).remove();
	}

	if(joiner === undefined)
	{
		videoName.innerHTML = name;
		setTimeout(() => {
			videoDiv.append(video);
			videoDiv.append(videoName);
			videoGrid.append(videoDiv);
			
			arrangeVideo();

			checkName();
			chName();
		}, 1000);
	}

	else
	{
		videoDiv.append(video);
		videoDiv.append(videoName);
		videoGrid.append(videoDiv);
		
		arrangeVideo();

		checkName();
		chName();
	}

	setTimeout(() => {chName();}, 1000);
}

const arrangeVideo = () => {
	let vid = $('.videoDiv');
	if(vid.length == 1)
	{
		vid[0].style.height = '100%';
		vid[0].style.width = '100%';
	}
	else if(vid.length == 2)
	{
		if(window.innerWidth>600)
		{
			vid.css('height','100%');
			vid.css('width','50%');
		}
		else
		{
			vid.css('height','50%');
			vid.css('width','100%');
		}
	}
	else if(vid.length == 3 || vid.length == 4)
	{
		vid.css('height','50%');
		vid.css('width','50%');
	}
	else if(vid.length == 5 || vid.length == 6)
	{
		vid.css('height','50%');
		vid.css('width','33.33%');
	}
	else
	{
		vid.css('height','33.33%');
		vid.css('width','33.33%');

		for(var i=9; i<vid.length; i++)
		{
			vid[i].style.display = 'none';
		}
	}
}

const scrollToBottom = () => {
	let d = $('.main__chat_window');
	d.scrollTop(d.prop('scrollHeight'))
}

const muteUnmute = () => {
	const enabled = myVideoStream.getAudioTracks()[0].enabled;
	if(enabled)
	{
		myVideoStream.getAudioTracks()[0].enabled = false;
		setUnmuteButton();
	}
	else
	{
		setMuteButton();
		myVideoStream.getAudioTracks()[0].enabled = true;
	}
}

setMuteButton = () => {
	const html = `
		<i class="fas fa-microphone"></i>
		<span class="d-none d-sm-flex">Mute</span>
	`

	document.querySelector('.main__mute_button').innerHTML = html;
}

setUnmuteButton = () => {
	const html = `
		<i class="unmute fas fa-microphone-slash"></i>
		<span class="d-none d-sm-flex">Unmute</span>
	`

	document.querySelector('.main__mute_button').innerHTML = html;
}

const playStop = () => {
	const enabled = myVideoStream.getVideoTracks()[0].enabled;
	if(enabled)
	{
		myVideoStream.getVideoTracks()[0].enabled = false;
		setPlayVideo();
	}
	else
	{
		setStopVideo();
		myVideoStream.getVideoTracks()[0].enabled = true;
	}
}

setStopVideo = () => {
	const html = `
		<i class="fas fa-video"></i>
		<span class="d-none d-sm-flex">Stop Video</span>
	`

	document.querySelector('.main__video_button').innerHTML = html;
}

setPlayVideo = () => {
	const html = `
		<i class="stop fas fa-video-slash"></i>
		<span class="d-none d-sm-flex">Play Video</span>
	`

	document.querySelector('.main__video_button').innerHTML = html;
}