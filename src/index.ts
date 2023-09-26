import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
const { Engine } = require("bpmn-engine");
const { EventEmitter } = require("events");
const fs= require('fs');
const path= require('path');
//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

app.get("/start", async (req: Request, res: Response) => {
  const id = Math.floor(Math.random() * 10000);

  const source = `
<?xml version="1.0" encoding="UTF-8"?>
  <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <process id="theProcess2" isExecutable="true">
    <startEvent id="theStart" />
    <exclusiveGateway id="decision" default="flow2" />
    <endEvent id="end1" />
    <endEvent id="end2" />
    <sequenceFlow id="flow1" sourceRef="theStart" targetRef="decision" />
    <sequenceFlow id="flow2" sourceRef="decision" targetRef="end1" />
    <sequenceFlow id="flow3" sourceRef="decision" targetRef="end2">
      <conditionExpression>true</conditionExpression>
    </sequenceFlow>
  </process>
</definitions>`;

  const engine = new Engine({
    name: "execution example",
    source,
    variables: {
      id,
    },
  });

  const execution = await engine.execute();

  console.log("Execution completed with id", execution);
  return res.send({ executionId: execution.environment.variables.id });
});

app.get("/start-with-listen", async (req: Request, res: Response) => {
  //const source = '';
  const resolvedPath= path.resolve(__dirname+'/test.xml');
  const source=fs.readFileSync(resolvedPath,'utf-8');
  const engine = new Engine({
    name: "listen example",
    source,
  });

  const listener = new EventEmitter();

  listener.once("wait", (task:any) => {
    console.log(task);
    res.send({wait: task.content})
    // task.signal({
    //   ioSpecification: {
    //     dataOutputs: [
    //       {
    //         id: "userInput",
    //         value: "von Rosen",
    //       },
    //     ],
    //   },
    // });
  });

//   listener.on("flow.take", (flow: any) => {
//     console.log(`flow <${flow.id}> was taken`);
//   });

//   engine.once("end", (execution:any) => {
//     console.log(execution.environment.variables);
//     console.log(
//       `User sirname is ${execution.environment.output.data.inputFromUser}`
//     );
//   });

  engine.execute(
    {
      listener,
    },
    (err: any) => {
      if (err) throw err;
    }
  );
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
