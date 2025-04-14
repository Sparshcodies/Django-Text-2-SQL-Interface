AOS.init({ duration: 1200 });
VANTA.NET({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x00ffff,
    backgroundColor: 0x0a0f24
});

// --- ADMIN PANEL JS ---
async function adminFetchSchema() {
const dbId = document.getElementById("admin-database").value;
if (!dbId || isNaN(parseInt(dbId))) {
    alert("Please select a valid database");
    return;
}

try {
    const schemaText = document.getElementById("admin-schema-text");
    schemaText.innerText = "Loading...";
    document.getElementById("admin-schema-display").classList.remove("d-none");

    const response = await fetch(`/fetch_schema/?database_id=${dbId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    schemaText.innerText = "";
    for (const [table, columns] of Object.entries(data.schema)) {
    schemaText.innerText += `Table: ${table}\n  Columns: ${columns.join(", ")}\n\n`;
    }

    const previewDiv = document.getElementById("admin-table-preview");
    const previewContent = document.getElementById("admin-preview-content");
    previewContent.innerHTML = "";

    if (data.table_previews && Object.keys(data.table_previews).length > 0) {
    for (const [table, html] of Object.entries(data.table_previews)) {
        const tableHeader = document.createElement("h6");
        tableHeader.innerHTML = `<strong>Preview of ${table}</strong>`;
        previewContent.appendChild(tableHeader);

        const tableContainer = document.createElement("div");
        tableContainer.innerHTML = html;
        previewContent.appendChild(tableContainer);

        const divider = document.createElement("hr");
        previewContent.appendChild(divider);
    }
    previewDiv.classList.remove("d-none");
    } else {
    previewContent.innerHTML = "<div class='alert alert-warning'>No table previews available.</div>";
    previewDiv.classList.remove("d-none");
    }
} catch (error) {
    console.error("Error fetching schema:", error);
    document.getElementById("admin-schema-text").innerText = `Error: ${error.message}`;
}
}

document.addEventListener("DOMContentLoaded", () => {
const refreshBtn = document.getElementById("refreshSchemaBtn");
if (refreshBtn) refreshBtn.addEventListener("click", adminFetchSchema);

const generateSQL = document.getElementById("admin-generateSQLButton");
if (generateSQL) generateSQL.addEventListener("click", async function () {
    const dbId = document.getElementById("admin-database").value;
    const userQuery = document.getElementById("admin-user-query").value;

    if (!dbId || isNaN(parseInt(dbId))) return alert("Please select a valid database first.");
    if (!userQuery.trim()) return alert("Please enter your question.");

    try {
    const formData = new FormData();
    formData.append("database_id", dbId);
    formData.append("user_query", userQuery);

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const response = await fetch("/process_query/", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
    });

    const result = await response.json();
    if (response.ok) {
        document.getElementById("admin-sql-text").value = result.sql_query;
        document.getElementById("admin-sql-output").classList.remove("d-none");
    } else {
        alert(result.error || "Failed to generate SQL query.");
    }
    } catch (error) {
    console.error("Error generating SQL:", error);
    alert("An error occurred while generating the SQL query.");
    }
});

const executeSQL = document.getElementById("admin-executeSQLButton");
if (executeSQL) executeSQL.addEventListener("click", async function () {
    const dbId = document.getElementById("admin-database").value;
    const sqlQuery = document.getElementById("admin-sql-text").value;

    if (!dbId || isNaN(parseInt(dbId))) return alert("Please select a valid database.");
    if (!sqlQuery.trim()) return alert("No SQL query to execute.");

    try {
    const formData = new FormData();
    formData.append("database_id", dbId);
    formData.append("sql_query", sqlQuery);

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const response = await fetch("/execute_query/", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
    });

    const result = await response.json();
    const resultsTable = document.getElementById("admin-results-table");
    resultsTable.innerHTML = "";

    if (response.ok) {
        resultsTable.innerHTML = result.results || `<div class='alert alert-success'>${result.message}</div>`;
        document.getElementById("admin-query-results").classList.remove("d-none");
    } else {
        resultsTable.innerHTML = `<div class='alert alert-danger'>${result.error}</div>`;
        document.getElementById("admin-query-results").classList.remove("d-none");
    }
    } catch (error) {
    console.error("Execution error:", error);
    alert("An error occurred while executing the SQL query.");
    }
});
});

// --- USER PANEL JS ---
async function fetchSchema() {
const dbId = document.getElementById("database").value;
if (!dbId || isNaN(parseInt(dbId))) {
    alert("Please select a valid database");
    return;
}

try {
    document.getElementById("schema-text").innerText = "Loading...";
    document.getElementById("schema-display").classList.remove("d-none");

    const response = await fetch(`/fetch_schema/?database_id=${dbId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const schemaText = document.getElementById("schema-text");
    schemaText.innerText = "";

    for (const [table, columns] of Object.entries(data.schema)) {
    schemaText.innerText += `Table: ${table}\n  Columns: ${columns.join(", ")}\n\n`;
    }

    const previewContent = document.getElementById("preview-content");
    previewContent.innerHTML = "";

    if (data.table_previews && Object.keys(data.table_previews).length > 0) {
    for (const [table, html] of Object.entries(data.table_previews)) {
        const tableHeader = document.createElement("h6");
        tableHeader.textContent = table;
        previewContent.appendChild(tableHeader);

        const tableContainer = document.createElement("div");
        tableContainer.innerHTML = html;
        previewContent.appendChild(tableContainer);

        const divider = document.createElement("hr");
        previewContent.appendChild(divider);
    }
    document.getElementById("table-preview").classList.remove("d-none");
    } else {
    previewContent.innerHTML = "<div class='alert alert-warning'>No table previews available</div>";
    document.getElementById("table-preview").classList.remove("d-none");
    }
} catch (error) {
    console.error("Error fetching schema:", error);
    document.getElementById("schema-text").innerText = `Error: ${error.message}`;
}
}

document.addEventListener("DOMContentLoaded", () => {
const generateSQLBtn = document.getElementById("generateSQLButton");
if (generateSQLBtn) generateSQLBtn.addEventListener("click", async () => {
    const dbId = document.getElementById("database").value;
    const userQuery = document.getElementById("user-query").value;

    if (!dbId || isNaN(parseInt(dbId))) return alert("Please select a valid database first.");
    if (!userQuery.trim()) return alert("Please enter your question.");

    try {
    const formData = new FormData();
    formData.append("database_id", dbId);
    formData.append("user_query", userQuery);

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const response = await fetch("/process_query/", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
    });

    const result = await response.json();

    if (response.ok) {
        document.getElementById("sql-text").value = result.sql_query;
        document.getElementById("sql-output").classList.remove("d-none");
    } else {
        alert(result.error || "Failed to generate SQL query.");
    }
    } catch (error) {
    console.error("Error generating SQL:", error);
    alert("An error occurred while generating the SQL query.");
    }
});

const executeSQLBtn = document.getElementById("executeSQLButton");
if (executeSQLBtn) executeSQLBtn.addEventListener("click", async () => {
    const dbId = document.getElementById("database").value;
    const sqlQuery = document.getElementById("sql-text").value;

    if (!dbId || isNaN(parseInt(dbId))) return alert("Please select a valid database.");
    if (!sqlQuery.trim()) return alert("No SQL query to execute.");

    try {
    const formData = new FormData();
    formData.append("database_id", dbId);
    formData.append("sql_query", sqlQuery);

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    const response = await fetch("/execute_query/", {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
    });

    const result = await response.json();
    const resultsTable = document.getElementById("results-table");
    resultsTable.innerHTML = "";

    if (response.ok) {
        resultsTable.innerHTML = result.results || `<div class='alert alert-success'>${result.message}</div>`;
        document.getElementById("query-results").classList.remove("d-none");
    } else {
        resultsTable.innerHTML = `<div class='alert alert-danger'>${result.error}</div>`;
        document.getElementById("query-results").classList.remove("d-none");
    }
    } catch (error) {
    console.error("Execution error:", error);
    alert("An error occurred while executing the SQL query.");
    }
});
});
