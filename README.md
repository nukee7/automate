Agent-Based Task Orchestration platform

#CORE INTELLIGENCE
The core intellignece of the app resides in /backend/src/core:
1) It start with execution on route (/run) executionService.start(workflowId, userId)
2) The core engine first parse the graph of workflow defined (stored in db).
3) Parsing includes validating the graph(no missing edge, no broken edge) then normalixzing the graph(convert from frontend structure to backend structure) then sort(1->2->3) for execution flow.
4) Then our core engine builds Execution context: shared memory for each execution. It help in data flow, error tracked, logs stored, state preserved.
5) For each node we do node registry resolution of how we have defined so that engine know which class to run
6) Executor runs sequentially for each execution step each node returns some result like ai node return the message from openai-api, email node returns "success" message. The message are stored like context.data["n"] where n is the sequential node number at which the message is recieved. For each node result to be shown live at frontend when they are being executed we could use websocket layer b/w back and front.
7) After the whole run we save the output and show it to frontend ui.

How execution works(overall):
 Create context
     ↓
Sort graph
     ↓
For each node:
  registry.get(type)
  node.run(context, config)
  store output
     ↓
Return context

How execution works(node level) with emitter:
for each node:
  emit START event
  try:
    retry N times:
      run node
    emit SUCCESS event
  catch:
    emit FAILURE event
    apply failure policy