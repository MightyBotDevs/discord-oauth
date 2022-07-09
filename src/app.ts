import express from 'express';
import logger from 'morgan';
import cookies from 'cookies';
import cookieParser from 'cookie-parser';
import * as http from 'http';
const debug = require('debug')('simple-oauth-ts:server')
import 'dotenv/config'

const port = 3000;

const app = express();

/* Router imports */
import router from '@routes/index'


app.use(logger('dev'));
app.use(cookieParser());
app.use(cookies.express(["token"]));
app.set('port', port)

/* Router uses */
app.use('/', router)

const server = http.createServer(app);
server.listen(port)
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            return process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            return process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
