const net = require('net')

class Request {
    // method, url = host + port + path
    // body
    // headers type length

    constructor(options) {
        this.method = options.method || "GET";
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {};
        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = 'application/x-www-form-urlencoded';
        }

        if (this.headers["Content-Type"] === 'application/json') {
            this.bodyText = JSON.stringify(this.body);
        }
        else if (this.headers["Content-Type"] === 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('');
        }
        this.headers["Content-Length"] = this.bodyText.length;
    }

    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}
\r
${this.bodyText}`
    }
    send(connection) {
        return new Promise((resolve,reject) => {
            const parser = new ResponseParser()
            if (connection) {
                connection.write(this.toString())
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString())
                })
            }
            connection.on('data', data => {
                resolve(data.toString());
                parser.receive(data.toString())
                console.log(parser.headers);
                connection.end();
            })
            connection.on('end', data => {
                reject(data)
                connection.end();
            })  
        })
    }
}

class Response {






}


class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;
        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;
    }
    receive(string) {
        for (let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }

    receiveChar(char) {
        if (this.current === this.WAITING_STATUS_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END;
            }
            else if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }  
            else {
                this.statusLine += char;
            }
        } 
        else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }  
        }
        else if (this.current === this.WAITING_HEADER_NAME) {
            
            if (char === ':') {
                
                this.current = this.WAITING_HEADER_SPACE;
            }
            else if (char === '\r') {
                this.current = this.WAITING_BODY;
                this.bodyParser = new TrunkedBodyParser();
            }
            else {
                this.headerName += char;
            }
        } 
        else if (this.current === this.WAITING_HEADER_SPACE) {
            
            if (char === ' ') {
                this.current = this.WAITING_HEADER_VALUE
            }
        }
        else if (this.current === this.WAITING_HEADER_VALUE) {
            
            if (char === '\r') {
                this.current = this.WAITING_HEADER_LINE_END
                this.headers[this.headerName] =  this.headerValue;  
                this.headerName = '';
                this.headerValue = '';
            } else {
                this.headerValue += char;
            }
        }
        else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        }
        else if (this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char)
        }
        // else if (this.current === this.WAITING_BODY) {
        //     if (char === '\n') {
        //         this.current = this.WAITING_HEADER_NAME;
        //     }
        // }
        else {

        }

    }
 }

class TrunkedBodyParser {
    constructor() {
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_END = 1;
        this.READING_TRUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.isFinished = false;
        this.length = 0;
        this.content = [];

        this.current = this.WAITING_LENGTH;  
    }
    receiveChar(char) {

        if (this.current === this.WAITING_LENGTH) {
            if (char == '\r') {
                if (this.length == 0) {
                    this.isFinished = true;
                }
                this.current = this.WAITING_LENGTH_LINE_END;
            } else {
                this.length *= 16;
                this.length += char.charCodeAt(0) - '0'.charCodeAt(0);
            }
        }
        else if(this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK;
            }
        }
        else if (this.current === this.READING_TRUNK) {
            this.content.push(char);
            this.length -- ;
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE;
            }
        }

        else if (this.current === this.WAITING_NEW_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_NEW_LINE_END;
            }
        }

        else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK;
            }
        }

    }
}


void async function() {
    let request = new Request({
        method: 'GET',
        host: '127.0.0.1',
        port: '1000',
        headers: {
            ["X-fOO2"]: "CUSTOMED"
        },
        body: {
            name: 'msx'
        }
    })
    let response = await request.send()
    // console.log(response);
}()



/*
const client = net.createConnection({ host: '127.0.0.1', port: 1000 }, () => {
    // console.log('connected to server');
    // client.write('POST / HTTP/1.1\r\n')
    // client.write('Host: 127.0.0.1')
    // client.write('Content-Length: 5\r\n')
    // client.write('Content-Typee: application/x-www-form-urlencoded\r\n')
    // client.write('\r\n')
    // client.write('f=aaa')


    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '1000',
        body: {
            name: 'msx'
        }
    })

    let requestString = request.toString();
    console.log(requestString);
    client.write(requestString)
})

client.on('data', data => {
    console.log(data.toString())
    client.end;
})

client.on('end', data => {
    console.log('disconnected from server')

}) */

