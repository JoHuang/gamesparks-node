const WATCH_DOG_INTERVAL = 60 * 1000;
const RECONNECT_INTERVAL = 3 * 1000;
const INIT_INTERVAL = 5 * 1000;
var GameSparksAdminSocket = new require('./GameSparksAdminSocket').socket;
var pool = {};
var socketNumber = 0;
var inited = false;

function initSender(url, secret, socketCount, onMessage, onInit, onSocketError, onSocketChange) {
  const poolConfig = {
    name : 'gamesparks',
    create : function(callback) {
      socketNumber += 1;
      var gameSparksAdminSocket = new GameSparksAdminSocket();
      gameSparksAdminSocket.init({
        url : url,
        secret : secret,
        onInit : function() {
          callback(null, gameSparksAdminSocket);
          if ( ! inited ) {
            inited = true;
            onInit();
          }
        },
        onError : function (error) {
          if (onSocketError) {
            onSocketError(error);
          }
  
          // Report to the pool that there was an error on this socket and it should throw it away
          callback(error, gameSparksAdminSocket);
        },
        onMessage : function( msg ) {
          if ( onMessage ) onMessage( msg );
        },
        debug : false,
        socketNumber: socketNumber,
        watchDogInterval: WATCH_DOG_INTERVAL,
      });

      const id = "" + socketNumber;
      gameSparksAdminSocket.id = id;
      pool[id] = gameSparksAdminSocket;
    },
    destroy : function(gameSparksAdminSocket) {
      gameSparksAdminSocket.close();
    },
    validate : function(gameSparksAdminSocket) {
      return gameSparksAdminSocket.ready();
    },
    count : socketCount
  };

  const createSocket = () => {
    poolConfig.create((error, socket) => {
      if (error) {
        poolConfig.destroy( socket );
        delete pool[socket.id];
        if (onSocketChange) {
          onSocketChange("Delete #" + socket.id + ", pool size = " + Object.keys(pool).length);
        }
        setTimeout(createSocket, RECONNECT_INTERVAL);
      }
      else {
        if (onSocketChange) {
          onSocketChange("Created #" + socket.id + ", pool size = " + Object.keys(pool).length);
        }
      }
    });
  }

  for (let i = 0; i < poolConfig.count; i++) {
    setTimeout(createSocket, i * INIT_INTERVAL);
  }
}

exports.init = function(url, secret, socketCount, onInit, onError){
  initSender(url, secret, socketCount, null, onInit, onError);
};

exports.initLiveListener = function(gameApiKey, secret, socketCount, onMessage, onInit, onError, onSocketChange){
  initSender("wss://service.gamesparks.net/ws/server/" + gameApiKey, secret, socketCount, onMessage, onInit, onError, onSocketChange);
};

exports.initPreviewListener = function(gameApiKey, secret, socketCount, onMessage, onInit, onError, onSocketChange){
  initSender("wss://preview.gamesparks.net/ws/server/" + gameApiKey, secret, socketCount, onMessage, onInit, onError, onSocketChange);
};

exports.getSocketNumber = function() { return socketNumber; }
