const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const addDays = require("date-fns/addDays");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Server DB: '${e.message}';`);
  }
};

initializeDBAndServer();

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let getTodoQuery = "";
  let data = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}'
             AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}'
             AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}'
             AND status = '${status}' AND priority = '${priority}';`;
      break;
    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}' AND status = '${status}' AND
             category = '${category}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}' AND
             category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}' AND priority = '${priority}'
             AND category = '${category}';`;
      break;
    default:
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE todo LIKE '${search_q}';`;
      break;
  }

  const dbTodoResponse = await db.all(getTodoQuery);
  response.send(dbTodoResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE id = ${todoId};`;
  const todoResponse = await db.get(getTodoQuery);
  response.send(todoResponse);
});

app.get("/agenda/", async (request, response) => {
  const { dueDate } = request.query;
  const newDate = addDays(new Date(dueDate));
  const getDateQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
             FROM todo WHERE due_date LIKE '${dueDate}';`;
  const dateResponse = await db.get(getDateQuery);
  response.send(dateResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `INSERT INTO todo ( id, todo, priority, status,
        category, due_date) VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}';`;
  const postTodoResponse = await db.run(postTodoQuery);
  const todoId = postTodoResponse.lastID;
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  let updateColumn = "";

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `SELECT *
             FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    id = previousTodo.id,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo SET 
    id = ${todoId},
    todo = '${todo}',
    category = '${category}',
    priority = '${priority}',
    status = '${status}',
    due_date = '${duaDate}'
    WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;