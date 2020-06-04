var http = require( 'http' );
const gs = require("../GameSparks").Listener;

const { GS_API_KEY, GS_SECRET_LISTENER } = require('./secret');

gs.initPreviewListener(GS_API_KEY, GS_SECRET_LISTENER, 5,
    () => {console.log( "message!");},
    () => {console.log( "inited!");},
    (error) => { console.log( error); },
    (info) => { console.log( info); }
);

var server = http.createServer( );
server.listen(  8080, function(){
    console.log( 'server listening on: http://localhost:' + ( 8080) );
});
