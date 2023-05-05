


const PartyMatchSocket = (server) => {
    // console.log(" server ===============  " , server)

	const ServerCmd = {   
		RoomDetected:"0",
		RequestRoom:"1",
		Join:"2",
		JoinLobby:"3",
		JoinLobbyRoom:"4",
		JoinRoom:"5",
		FailJoinRoom:"6",    
		RoundAlready:"7",        
		GotoGame:"8",
		StartGame:"9",
		PositionPlayer:"10",
		UpdatePos:"11",
		CheckPosition:"12",
		HitEnemy:"13",    
		Stunned:"14",
		Moving:"15",
		RequestTarget:"16",
		ResponseTarget:"17",
		CubeReset:"18",
		CountDown:"19",  
		CubeFall:"20",    
		RoundPass:"21",    
		PlayerDie:"22",    
		PlayerWin:"23",        
		PlayerLeaveRoom:"24",
		Leave:"25",
		EndGame:"26"    
	};
    const otpGenerator = require('otp-generator');
    var WebSocketServer = require('websocket').server;
    
    wsServer = new WebSocketServer({
        httpServer: server,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });
    
    function originIsAllowed(origin) {
      // put logic here to detect whether the specified origin is allowed.
      return true;
    }
        
    const RoomStores = [];
    function getRoom(len, roomId = null) {
        console.log("RoomStores before -------------  ", RoomStores)
        let roomRan = otpGenerator.generate(6, {
            // digits: true,
            upperCaseAlphabets: false,
            specialChars: false,
        });
        let isHost = "0";
        if(RoomStores.length == 0){
            RoomStores.push({
                room : roomId ? roomId : roomRan,
                numPlayer : 1
            })
            isHost = "1";
        } else {
            let lastRoom = RoomStores[RoomStores.length - 1];
            if(lastRoom.numPlayer < len){
                RoomStores[RoomStores.length - 1].numPlayer += 1;
            } else {
                RoomStores.push({
                    room : roomId ? roomId : roomRan,
                    numPlayer : 1
                })
                isHost = "1";
            }
        }
        console.log("RoomStores afterrrr -------------  ", RoomStores)
        let response = {
            host :  isHost,
            room :  RoomStores[RoomStores.length - 1].room
        }
        return response;
      }

      function randomIntArrayUnique(num, max) {
        let result = [];
        for (let i = 0; i < num; i++) {
          let randomNum = Math.floor(Math.random() * (max));
          while (result.includes(randomNum)) {
            randomNum = Math.floor(Math.random() * (max));
          }
          result.push(randomNum);
        }
        console.log("result random array ===========  ", result);
        return result;
      }
    //   randomIntArrayUnique(16, 16)
    
    const countPlayers = {};
    const rooms = {};
    const roomsStorePos = {};
    var Player = require('./PlayerPartyMatch.js');
    
    function parseVector3(str) {
        // console.log("str ============  " , str);
        var sliceString = str.slice(1,str.length - 1);
        // console.log("sliceString ============  " , sliceString);
        let arrPos = sliceString.split(',');
        let strReturn = arrPos;
        for (let index = 0; index < arrPos.length; index++) {
            strReturn[index] = parseFloat(arrPos[index]);
        }
        
        return strReturn;
      }
      function parseQuaternion(str) {
        // console.log("str ============  " , str);
        var sliceString = str.slice(1,str.length - 1);
        // console.log("sliceString ============  " , sliceString);
        let arrPos = sliceString.split(',');
        let strReturn = arrPos;
        for (let index = 0; index < arrPos.length; index++) {
            strReturn[index] = parseFloat(arrPos[index]);
        }
        
        return strReturn;
      }
    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
          // Make sure we only accept requests from an allowed origin
          request.reject();
          console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
          return;
        }

        // remove echo-protocol
        var connection = request.accept("", request.origin);
        // var connection = request.accept( request.origin);
        console.log((new Date()) + ' request ------------   ' , request.key);
        // const clientId = otpGenerator.generate(6, {
        //     // digits: true,
        //     upperCaseAlphabets: false,
        //     specialChars: false,
        // });
        const clientId = request.key;
        console.log("clientId ===================   " ,clientId);
        const leave = room => {
            console.log("_room leave leave ===========  " , room)
            // not present: do nothing
            if(! rooms[room][clientId]) return;
            let checkNewHost = "";
            // if the one exiting is the last one, destroy the room
            if(Object.keys(rooms[room]).length === 1){
                delete rooms[room];
                delete roomsStorePos[room];
                delete countPlayers[room];
            }
            // otherwise simply leave the room
            else {
                let isFindNewHost = false;
                if(rooms[room][clientId]["player"]["isHost"] == "1"){
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log("leave leave sock aaaa ad=====  " , sock["player"]);
                        if(sock["player"]["id"] != clientId && !isFindNewHost){
                            rooms[room][sock["player"]["id"]]["player"]["isHost"] = "1";
                            checkNewHost = sock["player"]["id"];
                            isFindNewHost = true;
                            console.log(" new host ------  " , sock["player"]);
                        }
                    });
                }				
				var leavePlayerIndex = rooms[room][clientId]["player"]["indexPlayer"];				
								
				console.log("_room leave leave =========== indexPlayer:" , leavePlayerIndex);
				console.log("_room leave leave =========== alivePlayer:" , countPlayers[room]["alivePlayer"]);
				countPlayers[room]["alivePlayer"] = countPlayers[room]["alivePlayer"].filter((value) => value != leavePlayerIndex);
				console.log("==> updated _room leave leave =========== alivePlayer:" , countPlayers[room]["alivePlayer"]);
							
				console.log("_room leave leave =========== indexPlayer:" , leavePlayerIndex);
				console.log("_room leave leave =========== aliveLobbyPlayer:" , countPlayers[room]["aliveLobbyPlayer"]);
				countPlayers[room]["aliveLobbyPlayer"] = countPlayers[room]["aliveLobbyPlayer"].filter((value) => value != leavePlayerIndex);
				console.log("==> updated _room leave leave =========== aliveLobbyPlayer:" , countPlayers[room]["aliveLobbyPlayer"]);
				
                delete rooms[room][clientId];
            }
            if(rooms[room]) {
    
                Object.entries(rooms[room]).forEach(([, sock]) => {
                    console.log("leave leave sock =====  " , sock["player"]);
                    let params = {
                        event : ServerCmd.PlayerLeaveRoom,
                        clientId : clientId,
                        newHost : checkNewHost,
						"alivePlayers" : countPlayers[room]["alivePlayer"],
						"aliveLobbyPlayer" : countPlayers[room]["aliveLobbyPlayer"],
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    sock.sendBytes(buffer);
                });
            }
    
        };
        function CheckIndexAvaible (randIndex, room){
            let index = false;
            Object.entries(rooms[room]).forEach(([, sock]) => {
                let _startIndex =  parseInt(sock["player"]["startIndex"]); 
                if(randIndex !=  _startIndex){
                    index = true;
                }
            });

            return index;
        }
        function GetRandomIndexPos (len, room){
            let index = -1;
            let condition = false;
            do {
                let randIndex = Math.floor(Math.random() * len);
                if(CheckIndexAvaible(randIndex, room)){
                    index = randIndex;
                    condition =  true;
                } else {
                    condition = false;
                }
            } while (!condition);
            return index;
        }
    
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                // plant text
            }
            else if (message.type === 'binary') {
                // console.log('Received Binary Message of ' + message.binaryData + ' bytes');
                // connection.sendBytes(message.binaryData);
    
                var data = JSON.parse(message.binaryData);
                // console.log('Received Message binary :  ' +  message.binaryData);
                const { meta, room } = data;
    
                if(meta === "requestRoom") {
                    console.log("playerLen =========== binary  " , parseInt(data.playerLen))
    
                    let host = data['host'];
                    let isSpectator = data['isSpectator'] == "1";
                    // let _room = getRoom(parseInt(data.playerLen), room);
                    let canJoin = true;
                    let _room;
                    if(host == "1"){
                        _room = room;
                        roomsStorePos[room] = randomIntArrayUnique(16, 16);
                    } else {
                        // _room = room.substring(0,room.length-1);
                        _room = room;                        

                        if (!rooms[_room]) {
                            let params = {
                                event: ServerCmd.FailJoinRoom,
                                clientId: clientId,
                                room: _room,
                                message: "Room id : " + _room + " is not availiable! Please try again.",
                            }
                            let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                            connection.sendBytes(buffer);
                            canJoin = false;
                            return;
                        }
                        else {
                            let countSpectator = 0;

                            if (Object.keys(rooms[_room]).length > 0) {
                                Object.entries(rooms[_room]).forEach(([, sock]) => {

                                    if (sock.player.isSpectator == "1") {
                                        countSpectator = countSpectator + 1;
                                    }
                                });
                            }
                            console.log("isSpectator ===========   ", isSpectator)
                            console.log("countSpectator ===========   ", countSpectator)
                            console.log("Object.keys(rooms[room]).length ===========   ", Object.keys(rooms[_room]).length)
                            // check max 8 user in a room
                            if (countSpectator >= 2 && isSpectator) {
                                let params = {
                                    event: ServerCmd.FailJoinRoom,
                                    clientId: clientId,
                                    room: _room,
                                    message: "Room id : " + _room + " is full spectator.",
                                }

                                let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                                connection.sendBytes(buffer);
                                canJoin = false;
                                return;
                            }
                            else if (Object.keys(rooms[room]).length - countSpectator >= 8 && isSpectator == false) {
                                let params = {
                                    event: ServerCmd.FailJoinRoom,
                                    clientId: clientId,
                                    room: _room,
                                    message: "Room id : " + _room + " is full players.",
                                }

                                let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                                connection.sendBytes(buffer);
                                canJoin = false;
                                return;
                            }
                            else {
                                Object.entries(rooms[_room]).forEach(([, sock]) => {

                                    if (sock.player.isStarted == "1") {

                                        let params = {
                                            event: ServerCmd.FfailJoinRoom,
                                            clientId: clientId,
                                            room: _room,
                                            message: "Room id : " + _room + " is started.",
                                        }
                                        let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                                        connection.sendBytes(buffer);
                                        canJoin = false;
                                        return;
                                    }
                                });
                            }
                        }
                    }
                    
                    if(canJoin)
                    {
                        let params = {
                            event : ServerCmd.RoomDetected,
                            clientId : clientId,
                            room : _room,
                        }
                        // let bufferArr = str2ab(JSON.stringify(params));
                        let buffer = Buffer.from(JSON.stringify(params), 'utf8');
        
                        connection.sendBytes(buffer);
                    }
                    
                }
                else if(meta === "joinLobby") {
    
                    if(!rooms[room]){
                        rooms[room] = {}; // create the room
						countPlayers [room] = {};
						countPlayers [room]["countPlayer"] = 0;
						countPlayers [room]["alivePlayer"] = [];
						countPlayers [room]["aliveLobbyPlayer"] = [];
                        // console.log(" created new aaaaaaaaaaaa room ===========  " , rooms)
                    }
                    if(! rooms[room][clientId]) rooms[room][clientId] = connection; // join the room
                    // console.log(' rooms[room] 111111111111 ========  ' , rooms);
    
                    var player = new Player();
                    player.id = clientId;
                    // player.playerName = "Player " + Object.keys(rooms[room]).length;
                    player.playerName = data.playerName;
                    player.userAppId = data.userAppId;
                    player.avatar = data.avatar;
                    player.room = room;
                    player.isSpectator = data.isSpectator;
                    player.gender = data.gender;
                    player.indexPlayer =  countPlayers [room]["countPlayer"];
                    countPlayers[room]["countPlayer"] = player.indexPlayer + 1;
					countPlayers[room]["aliveLobbyPlayer"].push(player.indexPlayer);
                    // let ranGender = Math.floor(Math.random() * 5) % 2 == 0 ? "0" : "1";
                    // console.log( "  ranGender ----------- " , ranGender)
                    // player.gender = ranGender;
                    console.log( "  new player created  ----------- " , player)
                    // let _pos = parseVector3(data.pos);
                    // console.log("pos :   " , _pos);
                    // player.position = _pos;
    
                    rooms[room][clientId]["player"] = player;// save player in room array
                    let players = [];
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
                        players.push(sock.player);
                    });
                    player.isHost = data.isHost;
                    // if(players.length == 1){
                    //     player.isHost = "1";
                    // } else {
                    //     player.isHost = "0";
                    // }                    
                    
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
                        var playerIndex = sock.player["indexPlayer"];
                        console.log( "  joinLobbyRoom param ----------- playerIndex = ", playerIndex)

                        let params = {
                            event : ServerCmd.JoinLobbyRoom,
                            clientId : clientId,
                            playerName : player.playerName,
                            userAppId : player.userAppId,
                            avatar : player.avatar,
                            //players : players,
                            isHost : player.isHost,
                            isSpectator : player.isSpectator,
						    "aliveLobbyPlayer" : countPlayers[room]["aliveLobbyPlayer"],
                        }

                        if(countPlayers[room]["aliveLobbyPlayer"].includes(playerIndex)) {

                            if( player.indexPlayer == playerIndex) {
                                params["players"] = players;
                            } else {
                                params["newPlayer"] = player;
                            }

                        }    
                        
                        sock.sendBytes( Buffer.from(JSON.stringify(params), 'utf8'));
                    });
    
                }
                else if(meta === "gotoGame") {
    
                    console.log("gotoGame  data ===========  " , data)
                    let params = {
                        event : ServerCmd.GotoGame,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    console.log("gotoGame  buffer========  " , buffer)
                    // console.log("startGame  rooms[room]========  " , rooms[room])
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        rooms[room][sock["player"]["id"]]["player"]["isStarted"] = "1";
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "join") {
    
                    // console.log(' clientId ========  ' , clientId);
    
                    if(! rooms[room]){
                        rooms[room] = {}; // create the room
                    }
                    if(! rooms[room][clientId]) rooms[room][clientId] = connection; // join the room

                    var player = rooms[room][clientId]["player"];
                    let _pos = parseVector3(data.pos);
                    console.log("pos :   " , _pos);
                    player.position = _pos;
                    player.isStarted = "1";
                    console.log( "  new player created  ----------- " , player)
                    player.characterIndex = data.characterIndex;
                   
                    rooms[room][clientId]["player"] = player;// save player in room array
               
                    // console.log( "  sock ----------- " , sock.player)
                    countPlayers[room]["alivePlayer"].push(player.indexPlayer);
                    
                    player.isHost = data.isHost;
                    // if(players.length == 1){
                    //     player.isHost = "1";
                    // } else {
                    //     player.isHost = "0";
                    // }
                    let params = {
                        event : ServerCmd.JoinRoom,
                        clientId : clientId,
                        playerName : player.playerName,
                        userAppId : player.userAppId,
                        avatar : player.avatar,
                        "alivePlayers" : countPlayers[room]["alivePlayer"],
                        isHost : player.isHost,
                        gender : player.gender,
                        isSpectator : player.isSpectator,
                        indexPlayer : player.indexPlayer,
                        roomPos : roomsStorePos[room],
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        console.log( "  sock ----------- " , sock.player)
    
                        sock.sendBytes(buffer);
                    });                   
    
                }
                else if(meta === "startGame") {
    
                    console.log("startGame  data ===========  " , data)
                    let maxTime = parseFloat(data.maxTime);
                    let params = {
                        event : ServerCmd.StartGame,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    console.log("startGame  buffer========  " , buffer)
                    // console.log("startGame  rooms[room]========  " , rooms[room])
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "checkPosition") {
    
                    console.log("checkPosition  data ===========  " , data)
                    let ranLength = parseInt(data.ranLength); 
                    let ranIndex = GetRandomIndexPos(ranLength, room);
                    rooms[room][clientId]["player"]["startIndex"] = ranIndex;
                    console.log(" checkPosition ranIndex  ===========  " , ranIndex)
                    let params = {
                        event : ServerCmd.PositionPlayer,
                        clientId : clientId,
                        ranIndex : ranIndex
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "roundAlready") {
    
                    console.log("roundAlready  data ===========  " , data)
                    let params = {
                        event : ServerCmd.RoundAlready,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === "countDown") {
    
                    console.log("countDown  data ===========  " , data)
                    let timeCount = parseInt(data.timer) - 1;
                    let params = {
                        event : ServerCmd.CountDown,
                        clientId : clientId,
                        timer : timeCount,
                    }
                    // console.log("countDown after  ==========  " , rooms[room][clientId]["player"])
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    if(rooms[room] && rooms[room][clientId]){
                        Object.entries(rooms[room]).forEach(([, sock]) => {
                            rooms[room][sock["player"]["id"]]["player"]["timer"] = timeCount;
                           sock.sendBytes(buffer)
                        });
                    }

                }
                else if(meta === "moving") {
    
                    // console.log("moving moving data ===========  " , data)
                    let _pos = parseVector3(data.pos);
                    let _posVelocity = parseVector3(data.velocity);
                    rooms[room][clientId]["player"]["position"] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : ServerCmd.Moving,
                        clientId : clientId,
                        velocity : _posVelocity,
                        h : data.h,
                        v : data.v
                        // pos : _pos
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === "hitEnemy") {
    
                    // console.log("moving moving data ===========  " , data)
                    let _pos = parseVector3(data.hitPos);
                    // rooms[room][clientId]["player"]["position"] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : ServerCmd.HitEnemy,
                        clientId : clientId,
                        hitEnemyId : data.enemyId,
                        hitPos : _pos,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === "stunned") {
    
                    // console.log("moving moving data ===========  " , data)
                    let _pos = parseVector3(data.hitPos);
                    // rooms[room][clientId]["player"]["position"] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : ServerCmd.Stunned,
                        clientId : clientId,
                        stunnedByEnemyId : data.enemyId,
                        hitPos : _pos,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === "updatePos") {
    
                    console.log("updatePos     data ===========  " , data)
                    let _pos = parseVector3(data.pos);
                    let _rot = parseQuaternion(data.rot);
                    // rooms[room][clientId]["player"]["position"] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : ServerCmd.UpdatePos,
                        clientId : clientId,
                        pos : _pos,
                        rot : _rot,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === "requestTarget") {
    
                    console.log("requestTarget  data ===========  " , data)
                    let params = {
                        event : ServerCmd.ResponseTarget,
                        clientId : clientId,
                        target : data.target,
                        ran1 : data.ran1,
                        ran2 : data.ran2,
                        ran3 : data.ran3,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === "cubeFall") {
                    console.log("cubeFall  data ===========  " , data)
                    let params = {
                        event : ServerCmd.CubeFall,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === "cubeReset") {
                    console.log("cubeReset  data ===========  " , data)
                    let params = {
                        event : ServerCmd.CubeReset,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === "roundPass") {
                    rooms[room][clientId]["player"]["round"] = parseInt(data.round);
                    let params = {
                        event : ServerCmd.RoundPass,
                        clientId : clientId,
                        roundPass :  parseInt(data.round),
                        countPlayer :  Object.keys(rooms[room]).length
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === "playerDie") {
                    console.log("playerDie data ========================= " + data);
                    rooms[room][clientId]["player"]["playerStatus"] = "die";
                    let params = {
                        event : ServerCmd.PlayerDie,
                        clientId : clientId,
                        playerStatus :  "die"
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
    
                }
                else if(meta === "playerWin") {
                    rooms[room][clientId]["player"]["playerStatus"] = "win";
                    rooms[room][clientId]["player"]["roundPass"] = parseInt(data.roundPass);
                    let params = {
                        event : ServerCmd.PlayerWin,
                        clientId : clientId,
                        playerStatus :  "win"
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === "endGame") {
    
                    let players = [];
                    Object.entries(rooms[room]).forEach(([, sock]) => {
                        players.push(sock.player);
                    });
                    // console.log("players  array ====================== " + players);
                    let params = {
                        event : ServerCmd.EndGame,
                        clientId : clientId,
                        players :  players
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === "leave") {
    
                    leave(room);
    
                }
                else if(! meta) {
                    // send the message to all in the room
    
                    // Object.entries(rooms[room]).forEach(([, sock]) => sock.sendBytes( JSON.stringify(param) ));
                }
    
            }
        });
    
        connection.on('close', function(reasonCode, description) {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
            // for each room, remove the closed socket
            Object.keys(rooms).forEach(room => leave(room));
            // console.log( " roomId ==============  " , roomId);
            // leave(roomId);
        });
    });
}
module.exports = {
    PartyMatchSocket,
  }
