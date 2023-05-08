


const PartyMatchSocket = (server) => {
    // console.log(" server ===============  " , server)
	const EServerCmd = {   
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
    
    const EPlayerProfile = {   
        ClientId:"0",
        Index:"1",
        AppId:"2",
        Avatar:"3",
        Gender:"4",
        NickName:"5",
        RoomId:"6",
        IsHost:"7",
        IsSpectator:"8",
        CharacterIndex:"9",
        StartIndex:"10",
        Position:"11",   
        IsStarted:"12",    
        Status:"13",    
        Round:"14",
        AlivePlayers:"15",
        AliveLobbyPlayers:"16",
        CountPlayers:"17"
	};
	const playerIdKey =  EPlayerProfile.ClientId;
	const nickNameKey =  EPlayerProfile.NickName;
	const appIdKey = EPlayerProfile.AppId;
	const avatarKey = EPlayerProfile.Avatar;	
	const isHostKey = EPlayerProfile.IsHost;
	const genderKey = EPlayerProfile.Gender;
	const isSpectatorKey = EPlayerProfile.IsSpectator;
	const characterIndexKey = EPlayerProfile.CharacterIndex;
	const playerIndexKey = EPlayerProfile.Index;
	const roomIdKey = EPlayerProfile.RoomId;
    const startIndexKey = EPlayerProfile.StartIndex;
    const positionKey = EPlayerProfile.Position;
    const isStartedKey = EPlayerProfile.IsStarted;
    const statusKey = EPlayerProfile.Status;
    const roundKey = EPlayerProfile.Round;
    const alivePlayerKey = EPlayerProfile.AlivePlayers;
	const aliveLobbyPlayerKey = EPlayerProfile.AliveLobbyPlayers;
	const countPlayersKey = EPlayerProfile.CountPlayers;

    const metaKey = "meta";
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
                roomIdKey: roomId ? roomId : roomRan,
                numPlayer : 1
            })
            isHost = "1";
        } else {
            let lastRoom = RoomStores[RoomStores.length - 1];
            if(lastRoom.numPlayer < len){
                RoomStores[RoomStores.length - 1].numPlayer += 1;
            } else {
                RoomStores.push({
                    roomIdKey: roomId ? roomId : roomRan,
                    numPlayer : 1
                })
                isHost = "1";
            }
        }
        console.log("RoomStores afterrrr -------------  ", RoomStores)
        let response = {
            host :  isHost,
            roomIdKey :  RoomStores[RoomStores.length - 1].room
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
        const leave = roomId => {
            console.log("_room leave leave ===========  " , roomId)
            // not present: do nothing
            if(! rooms[roomId][clientId]) return;
            let checkNewHost = "";
            // if the one exiting is the last one, destroy the room
            if(Object.keys(rooms[roomId]).length === 1){
                delete rooms[roomId];
                delete roomsStorePos[roomId];
                delete countPlayers[roomId];
            }
            // otherwise simply leave the room
            else {
                let isFindNewHost = false;
                if(rooms[roomId][clientId]["player"][isHostKey] == "1"){
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                        // console.log("leave leave sock aaaa ad=====  " , sock["player"]);
                        if(sock["player"][playerIdKey] != clientId && !isFindNewHost){
                            rooms[roomId][sock["player"][playerIdKey]]["player"][isHostKey] = "1";
                            checkNewHost = sock["player"][playerIdKey];
                            isFindNewHost = true;
                            console.log(" new host ------  " , sock["player"]);
                        }
                    });
                }				
				var leavePlayerIndex = rooms[roomId][clientId]["player"][EPlayerProfile.Index];				
								
				console.log("_room leave leave =========== indexPlayer:" , leavePlayerIndex);
				console.log("_room leave leave =========== alivePlayer:" , countPlayers[roomId][alivePlayerKey]);
				countPlayers[roomId][alivePlayerKey] = countPlayers[roomId][alivePlayerKey].filter((value) => value != leavePlayerIndex);
				console.log("==> updated _room leave leave =========== alivePlayer:" , countPlayers[roomId][alivePlayerKey]);
							
				console.log("_room leave leave =========== indexPlayer:" , leavePlayerIndex);
				console.log("_room leave leave =========== aliveLobbyPlayer:" , countPlayers[roomId][aliveLobbyPlayerKey]);
				countPlayers[roomId]["aliveLobbyPlayer"] = countPlayers[roomId][aliveLobbyPlayerKey].filter((value) => value != leavePlayerIndex);
				console.log("==> updated _room leave leave =========== aliveLobbyPlayer:" , countPlayers[roomId][aliveLobbyPlayerKey]);
				
                delete rooms[roomId][clientId];
            }
            if(rooms[roomId]) {
    
                Object.entries(rooms[roomId]).forEach(([, sock]) => {
                    console.log("leave leave sock =====  " , sock["player"]);
                    let params = {
                        event : EServerCmd.PlayerLeaveRoom,
                        clientId : clientId,
                        newHost : checkNewHost,				
                    }
                    params[alivePlayerKey] = countPlayers[roomId][alivePlayerKey];
                    params[aliveLobbyPlayerKey] = countPlayers[roomId][aliveLobbyPlayerKey];

                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    sock.sendBytes(buffer);
                });
            }
    
        };
        function CheckIndexAvaible (randIndex, room){
            let index = false;
            Object.entries(rooms[roomId]).forEach(([, sock]) => {
                let _startIndex =  parseInt(sock["player"][startIndexKey]); 
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
                //console.log('Received Message data :  ' + JSON.stringify(data));
                var roomId = data[roomIdKey];
                var meta = data[metaKey];
                						
                if(meta === EServerCmd.RequestRoom) {
                    console.log("playerLen =========== binary  " , parseInt(data.playerLen))
    
                    let host = data['host'];
                    let isSpectator = data[EPlayerProfile.IsSpectator] == "1";					
                    // let _room = getRoom(parseInt(data.playerLen), room);
                    let canJoin = true;
                    let _room;
                    if(host == "1"){
                        _room = roomId;
                        roomsStorePos[roomId] = randomIntArrayUnique(16, 16);
                    } else {
                        // _room = room.substring(0,room.length-1);
                        _room = roomId;                        

                        if (!rooms[_room]) {
                            let params = {
                                event: EServerCmd.FailJoinRoom,
                                clientId: clientId,
                                roomIdKey: _room,
                                message: "Room id : " + _room + " is not availiable! Please try again.",
                            }
							params[roomIdKey] = _room;
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
                            console.log("Object.keys(rooms[roomId]).length ===========   ", Object.keys(rooms[_room]).length)
                            // check max 8 user in a room
                            if (countSpectator >= 2 && isSpectator) {
                                let params = {
                                    event: EServerCmd.FailJoinRoom,
                                    clientId: clientId,                                 
                                    message: "Room id : " + _room + " is full spectator.",
                                }
								params[roomIdKey] = _room;

                                let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                                connection.sendBytes(buffer);
                                canJoin = false;
                                return;
                            }
                            else if (Object.keys(rooms[roomId]).length - countSpectator >= 8 && isSpectator == false) {
                                let params = {
                                    event: EServerCmd.FailJoinRoom,
                                    clientId: clientId,                                  
                                    message: "Room id : " + _room + " is full players.",
                                }
								params[roomIdKey] = _room;

                                let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                                connection.sendBytes(buffer);
                                canJoin = false;
                                return;
                            }
                            else {
                                Object.entries(rooms[_room]).forEach(([, sock]) => {

                                    if (sock.player.isStarted == "1") {

                                        let params = {
                                            event: EServerCmd.FailJoinRoom,
                                            clientId: clientId,                                            
                                            message: "Room id : " + _room + " is started.",
                                        }
										params[roomIdKey] = _room;
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
                            event : EServerCmd.RoomDetected,
                            clientId : clientId,                          
                        }

						params[roomIdKey] = _room;
                        // let bufferArr = str2ab(JSON.stringify(params));
                        let buffer = Buffer.from(JSON.stringify(params), 'utf8');
						console.log("params ===========   ", params)
                        connection.sendBytes(buffer);
                    }
                    
                }
                else if(meta === EServerCmd.JoinLobby) {
    
                    if(!rooms[roomId]){
                        rooms[roomId] = {}; // create the room
						countPlayers [roomId] = {};
						countPlayers [roomId][countPlayersKey] = 0;
						countPlayers [roomId][alivePlayerKey] = [];
						countPlayers [roomId][aliveLobbyPlayerKey] = [];
                        // console.log(" created new aaaaaaaaaaaa room ===========  " , rooms)
                    }
                    if(! rooms[roomId][clientId]) rooms[roomId][clientId] = connection; // join the room
                    // console.log(' rooms[roomId] 111111111111 ========  ' , rooms);
    
                    var player = {};
                    player[playerIdKey] = clientId;                    
                    player[nickNameKey] = data[nickNameKey];
                    player[appIdKey]    = data[appIdKey];
                    player[avatarKey]   = data[avatarKey];
                    player[roomIdKey]    = roomId;
                    player[isSpectatorKey] = data[isSpectatorKey];
                    player[genderKey]      = data[genderKey];
                    player[playerIndexKey] =  countPlayers [roomId][countPlayersKey];
                    countPlayers[roomId][countPlayersKey] = player[playerIndexKey] + 1;
					countPlayers[roomId][aliveLobbyPlayerKey].push(player[playerIndexKey]);
                    console.log( "  new player created  ----------- " , player);
    
                    rooms[roomId][clientId]["player"] = player;// save player in room array
                    let players = [];
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
                        players.push(sock.player);
                    });
                    player[isHostKey] = data[isHostKey];
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                        // console.log( "  sock ----------- " , sock.player)
                        var playerIndex = sock.player[playerIndexKey];
                        console.log( "  joinLobbyRoom param ----------- playerIndex = ", playerIndex);

                        let params = {						
                            event : EServerCmd.JoinLobbyRoom,
                            clientId : clientId,
						}
                        
						params[nickNameKey] = player[nickNameKey];
                        params[appIdKey]    = player[appIdKey] ;
                        params[avatarKey]   = player[avatarKey];                         
                        params[isHostKey]   = player[isHostKey];
                        params[isSpectatorKey] = player[isSpectatorKey];
						params[aliveLobbyPlayerKey] = countPlayers[roomId][aliveLobbyPlayerKey];                        

                        if(countPlayers[roomId][aliveLobbyPlayerKey].includes(playerIndex)) {

                            if( player[playerIndexKey] == playerIndex) {
                                params["players"] = players;
                            } else {
                                params["newPlayer"] = player;
                            }

                        }    
                        
                        sock.sendBytes( Buffer.from(JSON.stringify(params), 'utf8'));
                    });
    
                }
                else if(meta === EServerCmd.GotoGame) {
    
                    console.log("gotoGame  data ===========  " , data)
                    let params = {
                        event : EServerCmd.GotoGame,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    console.log("gotoGame  buffer========  " , buffer)
                    // console.log("startGame  rooms[roomId]========  " , rooms[roomId])
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                        rooms[roomId][sock["player"][playerIdKey]]["player"][EPlayerProfile.IsStarted] = "1";
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === EServerCmd.Join) {
    
                    // console.log(' clientId ========  ' , clientId);
    
                    if(! rooms[roomId]){
                        rooms[roomId] = {}; // create the room
                    }
                    if(! rooms[roomId][clientId]) rooms[roomId][clientId] = connection; // join the room

                    var player = rooms[roomId][clientId]["player"];
                    let _pos = parseVector3(data.pos);
                    console.log("pos :   " , _pos);
                    player[positionKey] = _pos;
                    player[startIndexKey] = "1";
                    console.log( "  new player created  ----------- " , player)
                    player[characterIndexKey] = data[characterIndexKey];
                   
                    rooms[roomId][clientId]["player"] = player;// save player in room array
               
                    // console.log( "  sock ----------- " , sock.player)
                    countPlayers[roomId][alivePlayerKey].push(player[playerIndexKey]);
                    
                    player[isHostKey] = data[isHostKey];
                    
                    let params = {
                        event : EServerCmd.JoinRoom,
                        clientId : clientId,
						roomPos : roomsStorePos[roomId],
					}
					
                    params[nickNameKey] = player[nickNameKey];
                    params[appIdKey] = player[appIdKey];
                    params[avatarKey] = player[avatarKey];
                    params[alivePlayerKey] = countPlayers[roomId][alivePlayerKey];
                    params[isHostKey] = player[isHostKey];
                    params[genderKey] = player[genderKey];
                    params[isSpectatorKey] = player[isSpectatorKey];
                    params[playerIndexKey] = player[playerIndexKey];                        
                    
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                        console.log( "  sock ----------- " , sock.player)
    
                        sock.sendBytes(buffer);
                    });                   
    
                }
                else if(meta === EServerCmd.StartGame) {
    
                    console.log("startGame  data ===========  " , data)
                    let maxTime = parseFloat(data.maxTime);
                    let params = {
                        event : EServerCmd.StartGame,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    console.log("startGame  buffer========  " , buffer)
                    // console.log("startGame  rooms[roomId]========  " , rooms[roomId])
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === EServerCmd.CheckPosition) {
    
                    console.log("checkPosition  data ===========  " , data)
                    let ranLength = parseInt(data.ranLength); 
                    let ranIndex = GetRandomIndexPos(ranLength, room);
                    rooms[roomId][clientId]["player"][startIndexKey] = ranIndex;
                    console.log(" checkPosition ranIndex  ===========  " , ranIndex)
                    let params = {
                        event : EServerCmd.PositionPlayer,
                        clientId : clientId,
                        ranIndex : ranIndex
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === EServerCmd.RoundAlready) {
    
                    console.log("roundAlready  data ===========  " , data)
                    let params = {
                        event : EServerCmd.RoundAlready,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
                }
                else if(meta === EServerCmd.CountDown) {
    
                    console.log("countDown  data ===========  " , data)
                    let timeCount = parseInt(data.timer) - 1;
                    let params = {
                        event : EServerCmd.CountDown,
                        clientId : clientId,
                        timer : timeCount,
                    }
                    // console.log("countDown after  ==========  " , rooms[roomId][clientId]["player"])
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    if(rooms[roomId] && rooms[roomId][clientId]){
                        Object.entries(rooms[roomId]).forEach(([, sock]) => {
                            rooms[roomId][sock["player"][playerIdKey]]["player"]["timer"] = timeCount;
                           sock.sendBytes(buffer)
                        });
                    }

                }
                else if(meta === EServerCmd.Moving) {
    
                    // console.log("moving moving data ===========  " , data)
                    let _pos = parseVector3(data.pos);
                    let _posVelocity = parseVector3(data.velocity);
                    rooms[roomId][clientId]["player"][positionKey] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : EServerCmd.Moving,
                        clientId : clientId,
                        velocity : _posVelocity,
                        h : data.h,
                        v : data.v
                        // pos : _pos
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === EServerCmd.HitEnemy) {
    
                    // console.log("moving moving data ===========  " , data)
                    let _pos = parseVector3(data.hitPos);
                    // rooms[roomId][clientId]["player"][EPlayerProfile.Position] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : EServerCmd.HitEnemy,
                        clientId : clientId,
                        hitEnemyId : data.enemyId,
                        hitPos : _pos,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === EServerCmd.Stunned) {
    
                    // console.log("moving moving data ===========  " , data)
                    let _pos = parseVector3(data.hitPos);
                    // rooms[roomId][clientId]["player"][EPlayerProfile.Position] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : EServerCmd.Stunned,
                        clientId : clientId,
                        stunnedByEnemyId : data.enemyId,
                        hitPos : _pos,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === EServerCmd.UpdatePos) {
    
                    console.log("updatePos     data ===========  " , data)
                    let _pos = parseVector3(data.pos);
                    let _rot = parseQuaternion(data.rot);
                    // rooms[roomId][clientId]["player"][EPlayerProfile.Position] = _pos;
                    // console.log("pos :   " , _pos);
                    let params = {
                        event : EServerCmd.UpdatePos,
                        clientId : clientId,
                        pos : _pos,
                        rot : _rot,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === EServerCmd.RequestTarget) {
    
                    console.log("requestTarget  data ===========  " , data)
                    let params = {
                        event : EServerCmd.ResponseTarget,
                        clientId : clientId,                                         
                        rans : data.rans,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                       sock.sendBytes(buffer)
                    });
    
                }
                else if(meta === EServerCmd.CubeFall) {
                    console.log("cubeFall  data ===========  " , data)
                    let params = {
                        event : EServerCmd.CubeFall,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === EServerCmd.CubeReset) {
                    console.log("cubeReset  data ===========  " , data)
                    let params = {
                        event : EServerCmd.CubeReset,
                        clientId : clientId,
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === EServerCmd.RoundPass) {
                    rooms[roomId][clientId]["player"][roundKey] = parseInt(data[roundKey]);
                    let params = {
                        event : EServerCmd.RoundPass,
                        clientId : clientId,
                        roundPass :  parseInt(data[roundKey]),                        
                    }
                    params[countPlayersKey] = Object.keys(rooms[roomId]).length;

                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === EServerCmd.PlayerDie) {
                    console.log("playerDie data ========================= " + data);
                    rooms[roomId][clientId]["player"][statusKey] = "die";
                    let params = {
                        event : EServerCmd.PlayerDie,
                        clientId : clientId,                       
                    }
                    params[statusKey] =  "die";
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes(buffer));
    
                }
                else if(meta === EServerCmd.PlayerWin) {
                    rooms[roomId][clientId]["player"][statusKey] = "win";
                    rooms[roomId][clientId]["player"]["roundPass"] = parseInt(data.roundPass);
                    let params = {
                        event : EServerCmd.PlayerWin,
                        clientId : clientId,                        
                    }

                    params[statusKey] =  "win";
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === EServerCmd.EndGame) {
    
                    let players = [];
                    Object.entries(rooms[roomId]).forEach(([, sock]) => {
                        players.push(sock.player);
                    });
                    // console.log("players  array ====================== " + players);
                    let params = {
                        event : EServerCmd.EndGame,
                        clientId : clientId,
                        players :  players
                    }
                    let buffer = Buffer.from(JSON.stringify(params), 'utf8');
                    Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes(buffer));
                }
                else if(meta === EServerCmd.Leave) {
    
                    leave(room);
    
                }
                else if(! meta) {
                    // send the message to all in the room
    
                    // Object.entries(rooms[roomId]).forEach(([, sock]) => sock.sendBytes( JSON.stringify(param) ));
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
