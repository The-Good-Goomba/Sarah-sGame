const http = require('http');
const fs = require('fs');

const port = 8041;

const codes = [
    1018,
    9730,
    1694,
    8335,
    2018,
    3406,
    1654,
    9420
];

var gameStarted = false;
var timerTime = 20; // In seconds

class Station {
    constructor(code) {
        this.timerLength = timerTime;
        this.status = 'stopped';
        this.timeout;
        this.code = code;
    }

    setLoseTimer = () => {
        clearInterval(this.timeout);
        this.timeout = setInterval(() => {
            this.status = 'lost';
            this.timerLength = 0;
        }, this.timerLength * 1000)
    }
}

var stations = {
    1: new Station(1018),
    2: new Station(9730),
    3: new Station(1694),
    4: new Station(8335),
    5: new Station(2018),
    6: new Station(3406),
    7: new Station(1654),
    8: new Station(9420)
};

var getSecondsSinceStart = () => {
    return Math.floor(performance.now() / 1000);
}

const server = http.createServer(async (request, response) => {
    console.log('Request for ' + request.url + ' by method ' + request.method);
    

    if (request.method === 'GET')
    {

        // MARK: Get file data
        response.statusCode = 200;

        let fileUrl;
        if (request.url === "/")
            fileUrl = __dirname + '/index.html';
        else 
            fileUrl =  __dirname + request.url;

        let fileExt = fileUrl.split('.').pop();


        fs.exists(fileUrl, (exists) => {
            if (!exists) { sendError(response) }
            else {
                if (fileExt === 'png') {
                    response.setHeader('Content-Type', 'image/png');
                } else if (fileExt === 'html') {
                    response.setHeader('Content-Type', 'text/html');
                } else if (fileExt === 'ttf') {
                    response.setHeader('Content-Type', 'font/ttf');
                } else if (fileExt === 'woff') {
                    response.setHeader('Content-Type', 'font/woff');
                }
                fs.createReadStream(fileUrl).pipe(response);
            }
        });

    }

    else if (request.method === 'POST')
    {
        let body = '';
        request.on('data', function(data) {
            body += data
            console.log(body);
        })
        request.on('end', function() {
            let obj = JSON.parse(body);

            if (obj.command === "openTeamPage") {
                response.setHeader('Content-Type', 'text/html');
                fs.createReadStream(__dirname + '/dabomb.html').pipe(response);
            } else if (obj.command === "startTimers") {
                if (!gameStarted)
                {
                    for (let x in stations) {
                        stations[x].timerStartTime = getSecondsSinceStart();
                        stations[x].timerLength = timerTime;
                        stations[x].status = 'ticking';
                        stations[x].setLoseTimer();
                    }
                    gameStarted = true;
                    setTimeout(() => {
                        for (let x in stations) {
                            if (stations[x].status !== 'lost') {
                                stations[x].status = 'stopped';
                            }
                        }
                    }, 60 * 60 * 1000)
                }
                response.setHeader('Content-Type', 'text/html');
                response.end("Ok!");
            } else if (obj.command === "resetGame") {
                stations = {
                    1: new Station(1018),
                    2: new Station(9730),
                    3: new Station(1694),
                    4: new Station(8335),
                    5: new Station(2018),
                    6: new Station(3406),
                    7: new Station(1654),
                    8: new Station(9420)
                };
                gameStarted = false;
                response.setHeader('Content-Type', 'text/html');
                response.end("Ok!");
            } else if (obj.command === "getStatus") {
                let sadfub;
                if (stations[obj.station].status === 'ticking')
                    sadfub = stations[obj.station].timerLength - (getSecondsSinceStart() - stations[obj.station].timerStartTime)  
                else
                    sadfub = stations[obj.station].timerLength;

                let uss = {
                    time: sadfub,
                    status: stations[obj.station].status
                }
                response.setHeader('Content-Type', 'text/html');
                response.end(JSON.stringify(uss));
            } else if (obj.command === "submitCode") {
                if (!gameStarted) {
                    response.setHeader('Content-Type', 'text/html');
                    response.end("The game has not started");
                    return;
                }

                if (obj.code === stations[obj.station].code) {
                    if (stations[obj.station].status === 'ticking'){
                        stations[obj.station].timerLength = stations[obj.station].timerLength - (getSecondsSinceStart() - stations[obj.station].timerStartTime);
                        stations[obj.station].status = 'stopped';
                        clearInterval(stations[obj.station].timeout);
                    } else if (stations[obj.station].status === 'stopped') {
                        stations[obj.station].timerStartTime = getSecondsSinceStart();
                        stations[obj.station].status = 'ticking';
                        stations[obj.station].setLoseTimer();
                    }
                    response.setHeader('Content-Type', 'text/html');
                    response.end("Success!");
                } else {
                    response.end("Womp womp!");
                }
                
            } else if (obj.command === "getAllTimers") {
                let stati = [];
                for (let i in stations)
                {
                    let sadfub;
                    if (stations[i].status === 'ticking')
                        sadfub = stations[i].timerLength - (getSecondsSinceStart() - stations[i].timerStartTime)  
                    else
                        sadfub = stations[i].timerLength;

                    stati.push({
                        time: sadfub,
                        status: stations[i].status
                    });
                }
                response.setHeader('Content-Type', 'text/html');
                response.end(JSON.stringify(stati));
            }
        })
    }

});

let sendError = (response) => {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/html');
    response.end("Uh Oh, Stinky! No page found.");
}

server.listen(port, () => {
    console.log(`Server listening on ${port} | http://localhost:${port}`);
});
