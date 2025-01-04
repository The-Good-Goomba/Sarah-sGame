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

class Team {
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
            this.timerTime = 0;
        }, this.timerTime)
    }
}

var teams = {
    1: new Team(1018),
    2: new Team(9730),
    3: new Team(1694),
    4: new Team(8335),
    5: new Team(2018),
    6: new Team(3406),
    7: new Team(1654),
    8: new Team(9420)
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
                    for (let x in teams) {
                        teams[x].timerStartTime = getSecondsSinceStart();
                        teams[x].timerTime = timerLength;
                        teams[x].status = 'ticking';
                        teams[x].setLoseTimer();
                    }
                    
                    setTimeout(() => {
                        for (let x in teams) {
                            if (teams[x].status !== 'lost') {
                                teams[x].status = 'stopped';
                            }
                        }
                    }, 60 * 60 * 1000)
                }
        
            } else if (obj.command === "resetGame") {
                teams = {
                    1: new Team(1018),
                    2: new Team(9730),
                    3: new Team(1694),
                    4: new Team(8335),
                    5: new Team(2018),
                    6: new Team(3406),
                    7: new Team(1654),
                    8: new Team(9420)
                };
            } else if (obj.command === "getStatus") {
                let sadfub;
                if (teams[obj.station].status === 'ticking')
                    sadfub = timerTime - (getSecondsSinceStart() - timerStartTime)  
                else
                    sadfub = timerTime;

                let uss = {
                    time: sadfub,
                    status: teams[obj.station].status
                }
                response.setHeader('Content-Type', 'text/html');
                response.end(JSON.stringify(uss));
            } else if (obj.command === "submitCode") {
                if (!gameStarted) {
                    response.setHeader('Content-Type', 'text/html');
                    response.end("The game has not started");
                    return;
                }

                if (obj.code === teams[obj.station].code) {
                    if (teams[obj.station].status === 'ticking'){
                        teams[obj.station].timerTime = teams[obj.station].timerTime - (getSecondsSinceStart() - teams[obj.station].timerStartTime);
                        teams[obj.station].status = 'stopped';
                    } else if (teams[obj.station].status === 'stopped') {
                        teams[obj.station].timerStartTime = getSecondsSinceStart();
                        teams[obj.station].status = 'ticking';
                    }
                    response.setHeader('Content-Type', 'text/html');
                    response.end("Success!");
                } else {
                    response.end("Womp womp!");
                }
                
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
