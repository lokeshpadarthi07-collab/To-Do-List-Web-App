# OrbitTask - Modern To-Do List Web Application

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![LocalStorage](https://img.shields.io/badge/Storage-Browser%20LocalStorage-14b8a6?style=for-the-badge)

A premium, responsive, and accessible personal task manager built with pure HTML5, CSS3, and Vanilla JavaScript. Developed as part of the **CodeOrbit Tech Full Stack Web Development Internship**.

---

## 📌 Project Information

- **Organization:** CodeOrbit Tech
- **Internship Track:** Full Stack Web Development
- **Task Identifier:** `Task 2 - To-Do List Web Application`
- **Project Folder / Repository Name:** `CodeOrbit_Task2_TodoApp`
- **Architecture:** Client-Side Single Page Application (SPA), Serverless, Framework-free

---

## 🌟 Features Overview

### 1. Task Management (CRUD)
- **Add Tasks:** Create tasks via input field or by pressing <kbd>Enter</kbd>. Automatic string trimming prevents whitespace-only tasks.
- **Immediate Feedback:** Instant task card rendering at the top of the list with smooth entrance animations.
- **Unique Identification:** Every task receives a cryptographically resilient ID (`task_<timestamp>_<random>`).
- **Complete / Activate:** One-click custom checkbox to toggle task completion. Completed items feature smooth strikethrough, subtle opacity transition, and a green "Done" status badge.
- **In-Place Editing:** Click the pencil icon to modify existing task titles directly within the card. Press <kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel. Guaranteed never to overwrite other tasks.
- **Delete Confirmation:** Delete single tasks or clear all completed tasks with an accessible modal dialog preventing accidental data loss.

### 2. Live Filters & Smart Search
- **Filter Tabs:** Effortlessly switch between:
  - **All Tasks** (with real-time count)
  - **Active Tasks** (pending items only)
  - **Completed Tasks** (archived completions)
- **Real-Time Search:** Instant client-side search filtering tasks as you type without modifying background data.
- **Clear Completed:** Single-click bulk removal of all completed items (automatically enabled when completed tasks exist).

### 3. Dynamic Metrics & Progress Bar
- **Productivity Progress:** Real-time animated progress bar indicating overall completion percentage.
- **Overview Metrics:** Instant stats showing **Total**, **Active**, and **Completed** task counts.

### 4. User Experience & Design
- **Theme:** Dark navy background (`#070b14`) accented with glowing teal (`#14b8a6` / `#2dd4bf`) and frosted glass cards (`backdrop-filter: blur(16px)`).
- **Responsive Layout:** Fluid layout engineered for mobile smartphones (320px+), tablets, laptops, and ultra-wide desktops.
- **Toast Notifications:** Non-blocking floating status notifications for add, edit, delete, complete, and clear actions.
- **Context-Aware Empty States:** Customized friendly graphics and helpful instructions when no tasks match the current filter or search.
- **Accessibility (a11y):** Keyboard navigable, ARIA labels, semantic landmark elements (`<header>`, `<main>`, `<dialog>`, `<footer>`), and accessible high-contrast focus rings.

---

## 💻 Technologies Used

| Technology | Role |
| :--- | :--- |
| **HTML5** | Semantic structure, accessible `<dialog>`, form validation attributes, ARIA roles |
| **CSS3** | Modern layout (Flexbox & CSS Grid), CSS Custom Properties (Design Tokens), Glassmorphism, Responsive Media Queries, Keyframe Animations |
| **Vanilla JavaScript (ES6+)** | State management, event delegation, DOM manipulation, input sanitization, error handling |
| **Browser LocalStorage API** | Client-side persistent data storage across browser sessions |

> **Note:** Zero external frameworks (no React, Angular, Vue, jQuery) or CSS libraries (no Tailwind, Bootstrap). Completely self-contained vanilla code.

---

## 📂 File Structure

```text
CodeOrbit_Task2_TodoApp/
│
├── index.html        # Main semantic markup, accessible dialogs & containers
├── style.css         # Complete design system, theme tokens, animations & responsive queries
├── script.js         # Modular JavaScript logic, state management, LocalStorage controller
└── README.md         # Comprehensive project documentation & testing manual
```

---

## 🚀 How to Run the Application Locally

Since this application requires no database, backend server, or npm packages, running it is completely hassle-free:

### Method 1: Direct File Launch (Quickest)
1. Navigate to the project directory on your computer:
   `c:\Users\lokes\OneDrive\Desktop\To-Do List Web App` (or inside `CodeOrbit_Task2_TodoApp`).
2. Double-click `index.html` to open it in your default web browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari).

### Method 2: VS Code Live Server Extension
1. Open the folder in Visual Studio Code.
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click `index.html` and click **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

### Method 3: Python Built-In Local Server
Open PowerShell or Terminal in the project root and run:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

---

## 💾 How LocalStorage Works in This Project

The application uses the browser's persistent `localStorage` API to ensure your tasks and settings survive page reloads and browser restarts.

### 1. Storage Keys
- `codeorbit_todo_tasks`: Stores the JSON-serialized array of task objects.
  ```json
  [
    {
      "id": "task_1740000000000_a1b2c3d",
      "title": "Complete CodeOrbit Task 2",
      "completed": true,
      "createdAt": 1740000000000,
      "updatedAt": 1740001000000
    }
  ]
  ```
- `codeorbit_todo_filter`: Stores the user's active filter tab (`'all'`, `'active'`, or `'completed'`).

### 2. Defensive Storage Architecture
- **Availability Check:** Uses a synthetic read/write test during boot to verify storage availability.
- **Graceful Fallback:** If the user is browsing in a restricted environment (e.g., storage quota exceeded or disabled cookies), the app logs a gentle warning and safely falls back to in-memory state without crashing.
- **Corruption Resilience:** `JSON.parse()` is wrapped inside `try/catch` blocks. If corrupt or malformed data is detected, the app resets safely to an empty array and notifies the user via a friendly toast.
- **XSS Prevention:** User-entered titles are rendered into the DOM exclusively using `element.textContent`, preventing any malicious script execution or HTML injection.

---

## 🧪 Comprehensive Manual Testing Checklist

| # | Test Scenario | Expected Result | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Add a Valid Task** | Task is added to the top of list; total counter increments; toast appears. | ✅ Passed |
| 2 | **Add Empty / Whitespace Task** | Rejected with inline red error message; no task is added; input retains focus. | ✅ Passed |
| 3 | **Toggle Completion** | Checkbox updates visual state; title applies strikethrough; progress bar updates. | ✅ Passed |
| 4 | **Reactivate Completed Task** | Clicking checkbox restores active state; progress bar recalculates. | ✅ Passed |
| 5 | **Edit Task (Save)** | Pencil icon opens inline input; modifying title and pressing Enter saves changes. | ✅ Passed |
| 6 | **Edit Task (Cancel)** | Clicking cancel or pressing Escape restores original title without changes. | ✅ Passed |
| 7 | **Delete Single Task** | Trash icon displays modal dialog; confirming removes item; counters update. | ✅ Passed |
| 8 | **Filter Switching** | Switching between "All", "Active", and "Completed" filters tasks accurately. | ✅ Passed |
| 9 | **Real-Time Search** | Typing in search bar instantly filters matching tasks; clearing restores list. | ✅ Passed |
| 10 | **Clear Completed Tasks** | "Clear Completed" prompts confirmation and deletes all finished items. | ✅ Passed |
| 11 | **Page Refresh Persistence** | Refreshing the page (F5 / Ctrl+R) retains all tasks, states, and filter selections. | ✅ Passed |
| 12 | **Mobile Responsiveness** | UI renders seamlessly across 360px, 768px, and 1200px viewport widths. | ✅ Passed |
| 13 | **Console Health Check** | Zero uncaught JavaScript errors or warnings in DevTools console. | ✅ Passed |

---

## 📤 Step-by-Step GitHub Upload Instructions

Follow these steps to upload your project to your GitHub account:

### Step 1: Initialize Git in your Project Folder
Open PowerShell or your terminal in `c:\Users\lokes\OneDrive\Desktop\To-Do List Web App`:
```bash
git init
```

### Step 2: Stage and Commit the Files
```bash
git add .
git commit -m "feat: complete OrbitTask To-Do Web App for CodeOrbit Internship Task 2"
```

### Step 3: Create a New Repository on GitHub
1. Log in to [GitHub](https://github.com).
2. Click the **+** icon in the top right corner and select **New repository**.
3. Name the repository: `CodeOrbit_Task2_TodoApp`.
4. Choose **Public**.
5. Leave "Initialize this repository with a README" **unchecked** (we already created one).
6. Click **Create repository**.

### Step 4: Link and Push to GitHub
Copy the commands shown on your GitHub page and run them in PowerShell:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/CodeOrbit_Task2_TodoApp.git
git push -u origin main
```
*(Replace `<YOUR-USERNAME>` with your GitHub username).*

---

## 🌐 How to Deploy Live via GitHub Pages (Free)

Deploy your application so your evaluators at CodeOrbit Tech can test it live in any browser:

1. Go to your repository on GitHub (`https://github.com/<YOUR-USERNAME>/CodeOrbit_Task2_TodoApp`).
2. Click on the **Settings** tab (near the top right).
3. In the left navigation menu, click on **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source:** Select `Deploy from a branch`.
   - **Branch:** Select `main` and folder `/ (root)`.
5. Click **Save**.
6. Wait 1 to 2 minutes. Refresh the GitHub Pages settings page.
7. You will see a banner:
   > **"Your site is live at `https://<YOUR-USERNAME>.github.io/CodeOrbit_Task2_TodoApp/`"**
8. Click the link to open and verify your live website!

---

## 📸 Recommended Internship Submission Screenshots

Capture these screenshots for your CodeOrbit Tech internship task submission report:

1. **`01_main_interface.png`**: The full application view showing the OrbitTask header, progress bar, sample tasks, and metric counters.
2. **`02_add_and_validation.png`**: Demonstrating both adding a new task and triggering the empty input validation message.
3. **`03_task_completion_and_progress.png`**: Showing completed tasks with strikethrough styling and the progress bar filled with percentage.
4. **`04_in_place_editing.png`**: Capturing a task card in active edit mode with the Save and Cancel buttons.
5. **`05_confirmation_modal.png`**: The modal dialog open with the blurred backdrop asking to confirm task deletion.
6. **`06_filter_and_search.png`**: Demonstrating the "Active" or "Completed" filter applied alongside a live search query.
7. **`07_localstorage_persistence.png`**: Browser Developer Tools (F12) -> Application Tab -> Local Storage showing the `codeorbit_todo_tasks` key with stored JSON data.
8. **`08_mobile_view.png`**: Responsive mobile view captured in Chrome DevTools Device Mode (e.g. iPhone 14 or Pixel 7).

---

## 👨‍💻 Author & Acknowledgements

- **Developer:** CodeOrbit Tech Full Stack Development Intern
- **Project Task:** Task 2 - To-Do List Web Application
- **Special Thanks:** CodeOrbit Tech Mentors & Engineering Team
