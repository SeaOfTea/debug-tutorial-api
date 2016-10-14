# Debugging Node.js (and Docker Containers)

I hate print statements, and you should too. 

Why should you have to modify your code just to inspect how it is working? OR, why is my Docker container a huge black box that I have no idea what is happening inside? Every time you want to add debug output to a docker container, you likely have to rebuild the entire image! 

Ugh, no thanks.

Hopefully this blog will show that none of that is necessary.

Let's start from the very beginning.

---

Git clone this very simple API

    git clone ssh://git@stash.inf.weboperations.co.uk:7999/~thomas.constantine/debug-tutorial-api.git
    npm install

Run node tutorial.js or npm start.

    node tutorial.js
    # listening at port 2000

Visit localhost:2000 and you should get a simple page that says "Debug App". It all works!

Let's get debugging. To do this, we need to generate a launch.json. Thankfully we can let Visual Studio Code take care of that for us.

First click the Debug pane in VSCode. (or Ctrl + Shift + D) [1]

Then click the cog in the debug page. [2]


***

It is marked with a orange dot to signify it will create a launch.json for you. Select node.js in the launch configuration menu.

You should have something like the below. If you are running node locally, i.e. not on a Guest VM, then you can keep both the 'Launch' and 'Attach To Process' entries. However, I am more interested in the remote debugging feature. This is the entry named "Attach".

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch",
            "type": "node",
            "request": "launch",
            "program": "${workspaceRoot}\\tutorial.js",
            "stopOnEntry": false,
            "args": [],
            "cwd": "${workspaceRoot}",
            "preLaunchTask": null,
            "runtimeExecutable": null,
            "runtimeArgs": [
                "--nolazy"
            ],
            "env": {
                "NODE_ENV": "development"
            },
            "console": "internalConsole",
            "sourceMaps": false,
            "outFiles": []
        },
        {
            "name": "Attach",
            "type": "node",
            "request": "attach",
            "port": 5858,
            "address": "localhost",
            "restart": false,
            "sourceMaps": false,
            "outFiles": [],
            "localRoot": "${workspaceRoot}",
            "remoteRoot": null
        },
        {
            "name": "Attach to Process",
            "type": "node",
            "request": "attach",
            "processId": "${command.PickProcess}",
            "port": 5858,
            "sourceMaps": false,
            "outFiles": []
        }
    ]
}
```

You will need to change the remoteRoot to be the working directory in your VM. 

For me this is `/home/developer/projects/debug-tutorial-api`

Like below:

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach",
            "type": "node",
            "request": "attach",
            "port": 5858,
            "address": "localhost",
            "restart": false,
            "sourceMaps": false,
            "outFiles": [],
            "localRoot": "${workspaceRoot}",
            "remoteRoot": "/home/developer/projects/debug-tutorial-api"
        }
    ]
}
```

We can then begin the node.js process with the `--debug` argument.
The default port is 5858 but feel free to override it using `--debug=6666`

```
node --debug tutorial.js
```

We can then attach Visual Studio's remote debugger to the remote node.js process on your Guest VM.

Make sure the port you selected is open in virtualbox (5858 by default).

Run the "Attach" configuration in Visual Studio Code.

You should get the debugging ribbon and the bar at the bottom should turn from blue to orange to signify a connection.

Set a breakpoint on line 7 and navigate to your app (by default at http://localhost:2000)

Visual Studio should stop at your breakpoint.
Try changing the value of the variable `response` in the variable window.
Notice how it has changed the value returned on the web page. You are changing live code.

### Debugging in a Docker container

Let's quickly whip up a Dockerfile.
For simplicity I am just going to copy everything into the Docker image.
This is not an example of good practice for a Dockerfile

```
FROM node:4.4.7

WORKDIR /opt/nodeapp

COPY . /opt/nodeapp

EXPOSE 2000
EXPOSE 5858

ENTRYPOINT ['node']

CMD ['tutorial.js']
```

And for ease sake let's make a Dockerfile to handle building and running the image.

```
nodeapp:
  build: .
  ports:
    - 2000:2000
    - 5858:5858
  entrypoint: [node]
  command: [--debug, tutorial.js]
```

We now need to add a new launch configuration to launch.json configurations array. 
The remoteRoot should MATCH your Dockerfile ENTRYPOINT.

```
{
    "name": "Attach To Docker",
    "type": "node",
    "request": "attach",
    "port": 5858,
    "address": "localhost",
    "restart": false,
    "sourceMaps": false,
    "outFiles": [],
    "localRoot": "${workspaceRoot}",
    "remoteRoot": "/opt/nodeapp"
}
```
Start your Docker container using docker-compose.

```
docker-compose build
docker-compose up
```

Open the debug pane and change the configuration selector to "Attach to Docker" and click Play.

You should now be remotely connected to the debug process inside your container.