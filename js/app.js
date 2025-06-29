let appState = {
  currentStage: "todo",
  tasks: {
    todo: [],
    completed: [],
    archived: [],
  },
  userData: {},
};

const checkUserData = () => {
  const storedUserData = localStorage.getItem("taskflow_user");
  if (!storedUserData) {
    window.location.href = "index.html";
    return false;
  }

  try {
    appState.userData = JSON.parse(storedUserData);
    return true;
  } catch (error) {
    console.error("Error parsing user data:", error);
    window.location.href = "index.html";
    return false;
  }
};

const renderUserInfo = () => {
  const usernameElement = document.getElementById("username");
  const avatarElement = document.getElementById("userAvatar");

  usernameElement.textContent = appState.userData.name;

  const avatarUrl = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(
    appState.userData.name
  )}`;
  avatarElement.style.backgroundImage = `url(${avatarUrl})`;
};

const signOut = () => {
  localStorage.removeItem("taskflow_user");
  localStorage.removeItem("taskflow_tasks");
  window.location.href = "index.html";
};

const getCurrentTimestamp = () => {
  return new Date().toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const showToast = (title, message) => {
  const toast = document.getElementById("toast");
  const toastTitle = document.getElementById("toastTitle");
  const toastMessage = document.getElementById("toastMessage");

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
};

const saveTasks = () => {
  localStorage.setItem("taskflow_tasks", JSON.stringify(appState.tasks));
};

const loadTasks = () => {
  const storedTasks = localStorage.getItem("taskflow_tasks");
  if (storedTasks) {
    try {
      appState.tasks = JSON.parse(storedTasks);
    } catch (error) {
      //   console.error("Error parsing tasks:", error);
      appState.tasks = { todo: [], completed: [], archived: [] };
    }
  }
};

const loadInitialData = async () => {
  const { todo, completed, archived } = appState.tasks;
  if (todo.length === 0 && completed.length === 0 && archived.length === 0) {
    try {
      const response = await fetch("https://dummyjson.com/todos");
      const data = await response.json();

      //   console.log(data);

      const initialTasks = data.todos.slice(0, 2).map((todo) => ({
        id: Date.now() + Math.random(),
        title: todo.todo,
        stage: "todo",
        lastModified: getCurrentTimestamp(),
      }));

      appState.tasks.todo = initialTasks;
      saveTasks();
      renderTasks();
      updateCounters();
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }
};

const focusOnTask = (taskId) => {
  setTimeout(() => {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 100);
};

const addTask = () => {
  const taskInput = document.getElementById("taskInput");
  const taskTitle = taskInput.value.trim();

  if (!taskTitle) {
    showToast("Error", "Please enter a task title.");
    return;
  }

  const newTask = {
    id: Date.now() + Math.random(),
    title: taskTitle,
    stage: appState.currentStage,
    lastModified: getCurrentTimestamp(),
  };

  appState.tasks[appState.currentStage].push(newTask);
  saveTasks();

  taskInput.value = "";
  renderTasks();
  updateCounters();
  focusOnTask(newTask.id);

  showToast(
    "Task Added",
    `Task added to ${capitalizeFirst(appState.currentStage)}.`
  );
};

const moveTask = (taskId, fromStage, toStage) => {
  const taskIndex = appState.tasks[fromStage].findIndex(
    (task) => task.id === taskId
  );
  if (taskIndex === -1) return;

  const task = appState.tasks[fromStage][taskIndex];
  task.stage = toStage;
  task.lastModified = getCurrentTimestamp();

  appState.tasks[fromStage].splice(taskIndex, 1);
  appState.tasks[toStage].push(task);

  saveTasks();
  renderTasks();
  updateCounters();

  showToast("Task Updated", `Task moved to ${capitalizeFirst(toStage)}.`);
};

const handleTaskAction = (taskId, action) => {
  const currentStage = appState.currentStage;

  switch (action) {
    case "complete":
      moveTask(taskId, currentStage, "completed");
      break;
    case "archive":
      moveTask(taskId, currentStage, "archived");
      break;
    case "move-todo":
      moveTask(taskId, currentStage, "todo");
      break;
    case "move-completed":
      moveTask(taskId, currentStage, "completed");
      break;
  }
};

const switchStage = (stage) => {
  appState.currentStage = stage;

  document.querySelectorAll(".stage-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelector(`[data-stage="${stage}"]`).classList.add("active");

  document.querySelectorAll(".task-stage").forEach((stageEle) => {
    stageEle.classList.remove("active");
  });
  document.getElementById(`${stage}Stage`).classList.add("active");

  renderTasks();
};

const getTaskActions = (stage) => {
  const archiveIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  switch (stage) {
    case "todo":
      return `
                <button class="task-btn complete-btn" data-action="complete">
                    Mark it as completed
                </button>
                <button class="task-btn archive-btn" data-action="archive">
                    ${archiveIcon} Archive
                </button>
            `;
    case "completed":
      return `
                <button class="task-btn move-todo-btn" data-action="move-todo">
                    Move to Todo
                </button>
                <button class="task-btn archive-btn" data-action="archive">
                    ${archiveIcon} Archive
                </button>
            `;
    case "archived":
      return `
                <button class="task-btn move-todo-btn" data-action="move-todo">
                    Move to Todo
                </button>
                <button class="task-btn move-completed-btn" data-action="move-completed">
                    Move to Completed
                </button>
            `;
    default:
      return "";
  }
};

const getTaskHTML = (task) => {
  const actions = getTaskActions(task.stage);
  const statusBadge =
    task.stage === "archived" ? '<div class="task-status">Archived</div>' : "";

  return `
        <div class="task-card" data-task-id="${task.id}">
            <div class="task-header">
                <div class="task-title">
                    <div>${task.title}</div>
                </div>
                <div class="task-timestamp">
                    <div class="label">Last modified at:</div>
                    <div>${task.lastModified}</div>
                </div>
            </div>
            <div class="task-actions">
                ${actions}
            </div>
            ${statusBadge}
        </div>
    `;
};

const getEmptyStateHTML = () => {
  const messages = {
    todo: {
      icon: "📝",
      title: "No tasks yet",
      subtitle: "Add your first task to get started!",
    },
    completed: {
      icon: "✅",
      title: "No completed tasks",
      subtitle: "Complete some tasks to see them here.",
    },
    archived: {
      icon: "📦",
      title: "No archived tasks",
      subtitle: "Archive tasks to clear your workspace.",
    },
  };

  const message = messages[appState.currentStage];

  return `
        <div class="empty-state">
            <div class="empty-state-icon">${message.icon}</div>
            <div class="empty-state-text">${message.title}</div>
            <div class="empty-state-subtext">${message.subtitle}</div>
        </div>
    `;
};

const setupTaskEventListeners = () => {
  document.querySelectorAll(".task-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      const taskCard = e.target.closest(".task-card");
      const taskId = parseFloat(taskCard.dataset.taskId);

      handleTaskAction(taskId, action);
    });
  });
};

const renderTasks = () => {
  const stageElement = document.getElementById(`${appState.currentStage}Stage`);
  const tasks = appState.tasks[appState.currentStage];

  //   console.log(appState.currentStage);

  if (tasks.length === 0) {
    stageElement.innerHTML = getEmptyStateHTML();
    return;
  }

  stageElement.innerHTML = tasks.map((task) => getTaskHTML(task)).join("");

  setupTaskEventListeners();
};

const updateCounters = () => {
  document.getElementById("todoCount").textContent = appState.tasks.todo.length;
  document.getElementById("completedCount").textContent =
    appState.tasks.completed.length;
  document.getElementById("archivedCount").textContent =
    appState.tasks.archived.length;
};

const setupEventListeners = () => {
  document.querySelectorAll(".stage-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const stage = e.target.dataset.stage;
      //   console.log(stage);
      switchStage(stage);
    });
  });

  const taskInput = document.getElementById("taskInput");
  const submitBtn = document.getElementById("submitBtn");

  submitBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  document.getElementById("signOutBtn").addEventListener("click", signOut);
};

const initTaskFlowApp = async () => {
  if (!checkUserData()) {
    return;
  }

  loadTasks();

  await loadInitialData();

  setupEventListeners();

  renderUserInfo();
  renderTasks();
  updateCounters();
};

document.addEventListener("DOMContentLoaded", initTaskFlowApp);
