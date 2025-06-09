 /**************************************************************************************************
     * EN: Code Snippet Organizer Webapp
     * IT: Organizzatore di Code Snippet
     * -----------------------------------------------------------------------------------------------
     * EN: This webapp allows developers to save, organize, edit, and delete code snippets.
     *     All snippet data is stored and loaded in real time from a CSV format in localStorage.
     *     It supports search, exporting to CSV, and viewing snippet details with syntax-highlighted code.
     *     Additionally, if the snippet's language indicates a file type, a "Download Code" button allows
     *     downloading the snippet in a file with the proper extension.
     *     The snippet form now includes a description field, and language is chosen from a dropdown.
     *
     * IT: Questa webapp permette agli sviluppatori di salvare, organizzare, modificare ed eliminare snippet di codice.
     *     Tutti i dati degli snippet sono memorizzati e caricati in tempo reale in formato CSV nel localStorage.
     *     Supporta la ricerca, l'esportazione in CSV e la visualizzazione dei dettagli degli snippet con evidenziazione del codice.
     *     Inoltre, se il campo "language" indica un'estensione specifica, il pulsante "Download Code" permette di scaricare
     *     il codice in un file con la corretta estensione.
     *     Il form ora include anche un campo "Description" e la scelta del linguaggio avviene tramite menu a tendina.
     ****************************************************************************************************/
    
    // ---------------------------
    // Language to File Extension Mapping - Mappatura linguaggio -> estensione file
    // ---------------------------
    const languageExtensions = {
      "html": ".html",
      "javascript": ".js",
      "php": ".php",
      "python": ".py",
      "css": ".css",
      "java": ".java",
      "c++": ".cpp",
      "c": ".c",
      "other": ".txt"
    };
    
    // ---------------------------
    // CSV Parsing and Generation Functions - Funzioni per parsare e generare CSV
    // ---------------------------
    function parseCSV(csv) {
      const lines = csv.split(/\r?\n/);
      const result = [];
      if (lines.length < 2) return result;
      const headers = lines[0].split(",");
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        result.push(obj);
      }
      return result;
    }
    
    function parseCSVLine(line) {
      const regex = /(?:"((?:[^"]|"")*)"|([^,]*))(,|$)/g;
      const fields = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        const field = match[1] ? match[1].replace(/""/g, '"') : match[2];
        fields.push(field);
        if (match[3] === "") break;
      }
      return fields;
    }
    
    function generateCSV(data) {
      const headers = ["id", "title", "description", "category", "language", "code"];
      let csv = headers.join(",") + "\n";
      data.forEach(item => {
        const row = headers.map(header => `"${String(item[header]).replace(/"/g, '""')}"`).join(",");
        csv += row + "\n";
      });
      return csv;
    }
    
    // ---------------------------
    // CSV Data Persistence - Persistenza dati CSV in localStorage
    // ---------------------------
    function loadSnippetsFromCSV() {
      let csv = localStorage.getItem("snippetsCSV");
      if (!csv) {
        // Initialize with header if not present
        csv = 'id,title,description,category,language,code\n';
        localStorage.setItem("snippetsCSV", csv);
      }
      return parseCSV(csv);
    }
    
    function saveSnippetsToCSV(data) {
      const csv = generateCSV(data);
      localStorage.setItem("snippetsCSV", csv);
    }
    
    // ---------------------------
    // Global Snippets Array loaded from CSV
    // ---------------------------
    let snippets = loadSnippetsFromCSV();
    
    // ---------------------------
    // DOM Elements - Elementi DOM
    // ---------------------------
    const snippetForm = document.getElementById("snippetForm");
    const snippetTitleInput = document.getElementById("snippetTitle");
    const snippetDescriptionInput = document.getElementById("snippetDescription");
    const snippetCategoryInput = document.getElementById("snippetCategory");
    const snippetLanguageInput = document.getElementById("snippetLanguage");
    const snippetCodeInput = document.getElementById("snippetCode");
    const snippetsList = document.getElementById("snippetsList");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    
    // Modal Elements (View) - Elementi Modal per visualizzazione
    const snippetModal = new bootstrap.Modal(document.getElementById("snippetModal"));
    const modalSnippetTitle = document.getElementById("modalSnippetTitle");
    const modalSnippetDescription = document.getElementById("modalSnippetDescription");
    const modalSnippetCategory = document.getElementById("modalSnippetCategory");
    const modalSnippetLanguage = document.getElementById("modalSnippetLanguage");
    const modalSnippetCode = document.getElementById("modalSnippetCode");
    const copyBtn = document.getElementById("copyBtn");
    const downloadBtn = document.getElementById("downloadBtn"); // Download Code button
    
    // Modal Elements (Edit) - Elementi Modal per modifica
    const editSnippetModal = new bootstrap.Modal(document.getElementById("editSnippetModal"));
    const editSnippetForm = document.getElementById("editSnippetForm");
    const editSnippetId = document.getElementById("editSnippetId");
    const editSnippetTitle = document.getElementById("editSnippetTitle");
    const editSnippetDescription = document.getElementById("editSnippetDescription");
    const editSnippetCategory = document.getElementById("editSnippetCategory");
    const editSnippetLanguage = document.getElementById("editSnippetLanguage");
    const editSnippetCode = document.getElementById("editSnippetCode");
    
    // Global variable to store the snippet currently shown in modal (for download)
    let currentModalSnippet = null;
    
    // ---------------------------
    // Render Snippets in the Grid (Always loaded from CSV)
    // ---------------------------
    function renderSnippets(filter = "") {
      // Always reload snippets from CSV dynamically
      snippets = loadSnippetsFromCSV();
      snippetsList.innerHTML = "";
      let filteredSnippets = snippets;
      if (filter) {
        const lowerFilter = filter.toLowerCase();
        filteredSnippets = snippets.filter(s => 
          s.title.toLowerCase().includes(lowerFilter) || 
          s.category.toLowerCase().includes(lowerFilter) ||
          s.description.toLowerCase().includes(lowerFilter)
        );
      }
      if (filteredSnippets.length === 0) {
        snippetsList.innerHTML = "<p class='text-center text-danger'>No snippets found.</p>";
        return;
      }
      filteredSnippets.forEach(snippet => {
        const colDiv = document.createElement("div");
        colDiv.className = "col-12 col-md-6";
        const cardDiv = document.createElement("div");
        cardDiv.className = "card mb-3";
        cardDiv.style.cursor = "pointer";
        
        // Card header with title and action buttons (Edit/Delete)
        const cardHeader = document.createElement("div");
        cardHeader.className = "card-header d-flex justify-content-between align-items-center";
        cardHeader.textContent = snippet.title;
  
        const btnGroup = document.createElement("div");
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-sm btn-warning me-1";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openEditSnippetModal(snippet.id);
        });
  
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteSnippet(snippet.id);
        });
  
        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);
        cardHeader.appendChild(btnGroup);
        cardDiv.appendChild(cardHeader);
  
        // Card body with category, language and truncated description
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
        const truncatedDesc = snippet.description.length > 50 ? snippet.description.substring(0,50) + "..." : snippet.description;
        cardBody.innerHTML = `<p><strong>Category:</strong> ${snippet.category}</p>
                              <p><strong>Language:</strong> ${snippet.language}</p>
                              <p><strong>Description:</strong> ${truncatedDesc}</p>`;
        cardDiv.appendChild(cardBody);
        colDiv.appendChild(cardDiv);
        snippetsList.appendChild(colDiv);
  
        // Click event to open view modal (for snippet details)
        cardDiv.addEventListener("click", () => {
          openSnippetModal(snippet);
        });
      });
    }
    
    // ---------------------------
    // Add New Snippet
    // ---------------------------
    snippetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const newSnippet = {
        id: Date.now().toString(),
        title: snippetTitleInput.value.trim(),
        description: snippetDescriptionInput.value.trim(),
        category: snippetCategoryInput.value.trim(),
        language: snippetLanguageInput.value.trim(),
        code: snippetCodeInput.value.trim(),
      };
      snippets.push(newSnippet);
      saveSnippetsToCSV(snippets);
      renderSnippets();
      snippetForm.reset();
    });
    
    // ---------------------------
    // Search Functionality
    // ---------------------------
    searchBtn.addEventListener("click", () => {
      const filter = searchInput.value.trim();
      renderSnippets(filter);
    });
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      renderSnippets();
    });
    
    // ---------------------------
    // Export CSV Functionality
    // ---------------------------
    exportCsvBtn.addEventListener("click", () => {
      if (snippets.length === 0) {
        alert("No snippets to export.");
        return;
      }
      const csvContent = generateCSV(snippets);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "snippets.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    // ---------------------------
    // Open Modal with Snippet Details (View Mode)
    // ---------------------------
    function openSnippetModal(snippet) {
      currentModalSnippet = snippet; // Save current snippet for download
      modalSnippetTitle.textContent = snippet.title;
      modalSnippetDescription.textContent = snippet.description;
      modalSnippetCategory.textContent = snippet.category;
      modalSnippetLanguage.textContent = snippet.language;
      modalSnippetCode.textContent = snippet.code;
      // Set code block class for highlighting (using language value)
      modalSnippetCode.className = snippet.language.toLowerCase();
      hljs.highlightElement(modalSnippetCode);
      snippetModal.show();
    }
    
    // ---------------------------
    // Copy Code to Clipboard
    // ---------------------------
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(modalSnippetCode.textContent).then(() => {
        alert("Code copied to clipboard!");
      });
    });
    
    // ---------------------------
    // Download Code File with Correct Extension
    // ---------------------------
    downloadBtn.addEventListener("click", () => {
      if (!currentModalSnippet) {
        alert("No snippet available for download.");
        return;
      }
      const language = currentModalSnippet.language.toLowerCase();
      // Determine file extension from mapping, default to .txt if not found
      const extension = languageExtensions[language] || ".txt";
      // Create a safe file name using the snippet title (spaces replaced by underscores)
      const fileName = currentModalSnippet.title.replace(/\s+/g, '_') + extension;
      const blob = new Blob([currentModalSnippet.code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    
    // ---------------------------
    // Delete Snippet
    // ---------------------------
    function deleteSnippet(id) {
      if (!confirm("Are you sure you want to delete this snippet?")) return;
      snippets = snippets.filter(s => s.id !== id);
      saveSnippetsToCSV(snippets);
      renderSnippets();
    }
    
    // ---------------------------
    // Edit Snippet: Open Edit Modal with snippet data pre-filled
    // ---------------------------
    function openEditSnippetModal(id) {
      const snippet = snippets.find(s => s.id === id);
      if (!snippet) return;
      editSnippetId.value = snippet.id;
      editSnippetTitle.value = snippet.title;
      editSnippetDescription.value = snippet.description;
      editSnippetCategory.value = snippet.category;
      editSnippetLanguage.value = snippet.language;
      editSnippetCode.value = snippet.code;
      editSnippetModal.show();
    }
    
    // Handle Edit Snippet Form Submission
    editSnippetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const id = editSnippetId.value;
      const index = snippets.findIndex(s => s.id === id);
      if (index === -1) return;
      snippets[index].title = editSnippetTitle.value.trim();
      snippets[index].description = editSnippetDescription.value.trim();
      snippets[index].category = editSnippetCategory.value.trim();
      snippets[index].language = editSnippetLanguage.value.trim();
      snippets[index].code = editSnippetCode.value.trim();
      saveSnippetsToCSV(snippets);
      renderSnippets();
      editSnippetModal.hide();
    });
    
    // ---------------------------
    // INITIALIZATION: Render snippets from CSV on page load (Real-time from CSV)
    // ---------------------------
    renderSnippets();
    
