
function loadSchema() {
    let databaseId = document.getElementById("database").value;
    
    fetch(`/text2sql/fetch-schema/?database_id=${databaseId}`)
    .then(response => response.json())
    .then(data => {
        let schemaDisplay = document.getElementById("schema-display");
        schemaDisplay.innerHTML = "<h3>Schema:</h3>";
        for (let table in data.schema) {
            schemaDisplay.innerHTML += `<b>${table}</b>: ${data.schema[table].join(", ")}<br>`;
        }

        let tablePreview = document.getElementById("table-preview");
        tablePreview.innerHTML = "<h3>Table Previews:</h3>";
        for (let table in data.table_previews) {
            tablePreview.innerHTML += `<h4>${table}</h4> ${data.table_previews[table]}`;
        }
    })
    .catch(error => console.error("Error loading schema:", error));
}




function getCSRFToken() {
    let tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    return tokenElement ? tokenElement.value : '';
}

document.addEventListener("DOMContentLoaded", function () {
    let generateSQLButton = document.getElementById("generateSQLButton");
    if (generateSQLButton) {
        generateSQLButton.addEventListener("click", generateSQL);
    } else {
        console.error("Generate SQL button not found!");
    }
});

function generateSQL() {
    let databaseElement = document.getElementById("database");
    let userQueryElement = document.getElementById("user-query");

    if (!databaseElement || !userQueryElement) {
        console.error("Database dropdown or user query input not found!");
        return;
    }

    let databaseId = databaseElement.value;
    let userQuery = userQueryElement.value;
    let csrfTokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
    let csrfToken = csrfTokenElement ? csrfTokenElement.value : "";

    if (!databaseId || !userQuery) {
        alert("Please select a database and enter a query.");
        return;
    }

    console.log("Sending request with:", { databaseId, userQuery });

    fetch("/text2sql/process-query/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": csrfToken,
        },
        body: `database_id=${databaseId}&user_query=${userQuery}`,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }
        document.getElementById("sql-output").innerText = data.sql_query;
        console.log("SQL Query:", data.sql_query);
    })
    .catch(error => console.error("Error generating SQL query:", error));
}



function forgotPassword() {
    alert("Contact the administrator at admin@example.com for password reset.");
}

function forgotUsername() {
    alert("Contact the administrator at admin@example.com to retrieve your username.");
}

document.addEventListener("DOMContentLoaded", function () {
    let executeSQLButton = document.getElementById("executeSQLButton");
    if (executeSQLButton) {
        executeSQLButton.addEventListener("click", executeSQL);
    } else {
        console.error("Execute SQL button not found!");
    }
});

function executeSQL() {
    let databaseElement = document.getElementById("database");
    let sqlOutputElement = document.getElementById("sql-output");

    if (!databaseElement || !sqlOutputElement) {
        console.error("Database selection or SQL output field not found!");
        return;
    }

    let databaseId = databaseElement.value;
    let sqlQuery = sqlOutputElement.innerText.trim();
    let csrfTokenElement = document.querySelector("[name=csrfmiddlewaretoken]");
    let csrfToken = csrfTokenElement ? csrfTokenElement.value : "";

    if (!databaseId || !sqlQuery) {
        alert("Please generate a query first before executing.");
        return;
    }

    console.log("Executing SQL with:", { databaseId, sqlQuery });

    fetch("/text2sql/execute-query/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": csrfToken,
        },
        body: `database_id=${databaseId}&sql_query=${encodeURIComponent(sqlQuery)}`,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }
        if (data.message) {
            alert(data.message);
        } else {
            document.getElementById("query-results").innerHTML = data.results;
        }
    })
    .catch(error => console.error("Error executing SQL query:", error));
}


