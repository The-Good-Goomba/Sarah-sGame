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

var timerStartTime;
var timerTime = 20;

var teams = {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {},
    6: {},
    7: {},
    8: {}
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
            } else if (obj.command === "openCreateTeam") {
                response.setHeader('Content-Type', 'text/html');
                fs.createReadStream(__dirname + '/createTeam.html').pipe(response);
            } else if (obj.command === "openJoinTeam") {
                response.setHeader('Content-Type', 'text/html');
                fs.createReadStream(__dirname + '/joinTeam.html').pipe(response);
            } else if (obj.command === "createTeam") {
                
                if (obj.teamNumber > 8 || obj.teamNumber < 1) {
                    response.writeHead(200, {'Content-Type': 'text/html'})
                    response.end('teamNumberInvalid');
                    return;
                } 
                if (teams[obj.teamNumber].taken) {
                    response.writeHead(200, {'Content-Type': 'text/html'})
                    response.end('teamMade');
                    return;
                } 
                if (obj.teamName.length > 10) {
                    response.writeHead(200, {'Content-Type': 'text/html'})
                    response.end('tooLong');
                    return;
                }

                for (let x in teams) {
                    if (teams[x].name == obj.teamName) {
                        response.writeHead(200, {'Content-Type': 'text/html'})
                        response.end('teamNameTaken');
                        console.log("here2");
                        return;
                    }
                }

                teams[obj.teamNumber].taken = true;
                teams[obj.teamNumber].name = obj.teamName;
                response.setHeader('Content-Type', 'text/html');
                fs.createReadStream(__dirname + '/dabomb.html').pipe(response);    
            } else if (obj.command === "isTeamMade") {
                let sus = "No";
                if (teams[obj.teamNumber].taken) sus = "Yes";
                response.setHeader('Content-Type', 'text/html');
                response.end(sus)
            } else if (obj.command === "startTimers") {
                if (!timerStartTime) { 
                    console.log("Starting timer");
                    timerStartTime = getSecondsSinceStart(); 
                    setTimeout(() => {
                        console.log("Starting timer");
                        for (let x in teams) {
                            if (typeof teams[x].completionTime === 'undefined') {
                                teams[x].completionTime = 0;
                            }
                        }
                    }, timerTime * 1000)
                }
            } else if (obj.command === "resetGame") {
                timerStartTime = undefined;
                teams = {
                    1: {},
                    2: {},
                    3: {},
                    4: {},
                    5: {},
                    6: {},
                    7: {},
                    8: {}
                };
            } else if (obj.command === "getStatus") {
                if (typeof teams[obj.teamNumber]?.name === 'undefined') {
                    response.setHeader('Content-Type', 'text/html');
                    response.end("teamInvalid");
                    return;
                }
                let sadfub;
                if (typeof timerStartTime === 'undefined')
                    sadfub = timerTime;
                else 
                    sadfub = timerTime - (getSecondsSinceStart() - timerStartTime)

                let uss = {
                    completionTime: teams[obj.teamNumber].completionTime,
                    time: sadfub,
                    name: teams[obj.teamNumber].name
                }
                response.setHeader('Content-Type', 'text/html');
                response.end(JSON.stringify(uss));
            } else if (obj.command === "submitCode") {
                if (typeof teams[obj.teamNumber]?.name === 'undefined') {
                    response.setHeader('Content-Type', 'text/html');
                    response.end("teamInvalid");
                    return;
                }

                if (obj.code === codes[obj.teamNumber - 1]) {
                    if (typeof teams[obj.teamNumber].completionTime === 'undefined')
                        teams[obj.teamNumber].completionTime = timerTime - (getSecondsSinceStart() - timerStartTime);
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
