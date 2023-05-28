const express = require("express");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http:/localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializeDBAndServer();

const checkRequestsQueries = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryArray = ["WORK", "HOME", "LEARNING"];
    const categoryIsInArray = categoryArray.includes(category);
    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "MEDIUM", "LOW"];
    const priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date);

      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      console.log(formatedDate, "f");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      console.log(result, "r");
      console.log(new Date(), "new");

      const isValidDate = await isValid(result);
      console.log(isValidDate, "V");
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }

  request.todoId = todoId;
  request.search_q = search_q;

  next();
};

const checkRequestsBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

app.get("/todos/", checkRequestsQueries, async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  let getTodoQuery = "";
  let data = null;

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.status !== undefined && requestQuery.priority !== undefined
    );
  };

  const hasSearchProperty = (requestQuery) => {
    return requestQuery.search_q !== undefined;
  };

  const hasCategoryAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.status !== undefined && requestQuery.category !== undefined
    );
  };

  const hasCategoryAndPriorityProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.category !== undefined
    );
  };

  const hasCategoryProperty = (requestQuery) => {
    return requestQuery.category !== undefined;
  };

  hasCategoryAndPriorityProperties(request.query);
  hasCategoryAndStatusProperties(request.query);
  hasCategoryProperty(request.query);
  hasPriorityAndStatusProperties(request.query);
  hasStatusProperty(request.query);
  hasSearchProperty(request.query);
  hasPriorityProperty(request.query);

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%'
AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%'
AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%'
AND status = '${status}' AND priority = '${priority}';`;
      break;
    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND
category = '${category}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%' AND
category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'
AND category = '${category}';`;
      break;
    default:
      getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", checkRequestsQueries, async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT id, todo, priority, status, category, due_date as dueDate
FROM todo WHERE id = ${todoId};`;
  const todoResponse = await db.get(getTodoQuery);
  response.send(todoResponse);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const isValidDate = isValid(new Date(date));
    if (isValidDate) {
      const formatDate = format(new Date(date), "yyyy-MM-dd");
      const getDateQuery = `SELECT
id, todo, priority, status, category, due_date as dueDate FROM todo
WHERE due_date = '${formatDate}';`;

      const dbDate = await db.all(getDateQuery);
      response.send(dbDate);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//Add Todo API-4
app.post("/todos/", checkRequestsBody, async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request;

  const addTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (
                ${id},
               '${todo}',
               '${priority}',
               '${status}',
               '${category}',
               '${dueDate}'
            )
        ;`;

  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//Update Todo API-5
app.put("/todos/:todoId/", checkRequestsBody, async (request, response) => {
  const { todoId } = request;

  const { priority, todo, status, category, dueDate } = request;

  let updateTodoQuery = null;

  console.log(priority, todo, status, dueDate, category);
  switch (true) {
    case status !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                status = '${status}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case priority !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                priority = '${priority}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      updateTodoQuery = `
            UPDATE
                todo
            SET 
                todo = '${todo}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      const updateCategoryQuery = `
            UPDATE
                todo
            SET 
                category = '${category}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      const updateDateQuery = `
            UPDATE
                todo
            SET 
                due_date = '${dueDate}'
            WHERE 
                id = ${todoId}     
        ;`;
      await db.run(updateDateQuery);
      response.send("Due Date Updated");
      break;
  }
});

//Delete Todo API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM 
                todo
            WHERE 
               id=${todoId}
     ;`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
