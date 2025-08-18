# Project Development Timeline: TestPoint Admin Dashboard

This document outlines a projected 8-week timeline for the development of the TestPoint application, from initial setup to deployment and post-launch support.

---

### **Week 1: Foundation & Core Setup**

**Goal:** Establish the project's technical foundation and set up the basic application shell.

- **Tasks:**
  - Initialize Next.js project with TypeScript.
  - Set up Firebase project and integrate Firebase SDK into the Next.js application.
  - Configure and install UI components (ShadCN UI, Tailwind CSS).
  - Create the main application layout, including the primary dashboard and sidebar structures.
  - Implement user authentication (login, logout) using Firebase Authentication.
  - Set up protected routes and middleware for authentication checks.
  - Create initial Firestore security rules for basic access control.

---

### **Week 2: User & Group Management**

**Goal:** Build the core features for managing users and organizing them into groups.

- **Tasks:**
  - Finalize Firestore data models for the `users` and `groups` collections.
  - Develop API endpoints (CRUD operations) for managing users and groups.
  - Build the **User Management** interface for admins to create, edit, and delete users.
  - Build the **Group Management** interface for admins and teachers to create groups and assign users.
  - Implement role-based access control to ensure only authorized users can perform management actions.
  - Add functionality for bulk user import/export via CSV.

---

### **Week 3: Test & Question Management**

**Goal:** Develop the test creation and question-building functionalities for teachers.

- **Tasks:**
  - Finalize Firestore data models for the `tests` collection and its `questions` subcollection.
  - Create API endpoints for creating and editing test details.
  - Build the dynamic **Question Management** interface, allowing teachers to add, edit, and delete questions and options.
  - Implement real-time saving for question changes with status indicators (e.g., "Saving...", "All changes saved").
  - Add functionality to import questions from a CSV file.

---

### **Week 4: Test Lifecycle & Publishing**

**Goal:** Implement the complete lifecycle for tests, from draft to completion.

- **Tasks:**
  - Implement the test status logic (`draft`, `ongoing`, `completed`) in the backend and frontend.
  - Build the main **Test Management** dashboard with tabbed views for each status.
  - Develop the logic for publishing draft tests and reverting ongoing/completed tests back to draft.
  - Implement bulk actions for managing tests (e.g., bulk publish, revert, delete).
  - Refine the teacher dashboard to show only the tests they have created.

---

### **Week 5: Student Test-Taking Experience**

**Goal:** Create the interface and logic for students to take their assigned tests.

- **Tasks:**
  - Finalize the Firestore data model for the `test_sessions` collection to track student progress.
  - Create a student-facing view to list their assigned, active tests.
  - Build the test-taking interface, presenting one question at a time.
  - Implement the test timer and progress bar.
  - Develop the logic for saving student answers to Firestore in real-time as they progress through the test.

---

### **Week 6: Results, Grading, & Session Management**

**Goal:** Enable teachers to view test results and manage student test sessions.

- **Tasks:**
  - Implement server-side logic for automatic grading upon test completion.
  - Create the API endpoint to fetch detailed results for a specific test, including all student sessions.
  - Build the **Test Results** page to display student scores, submission times, and statuses.
  - Implement the functionality for teachers to reset an individual student's test session while the test is ongoing.
  - Calculate and display aggregate statistics like the average score.

---

### **Week 7: Anti-Cheat System Integration**

**Goal:** Integrate the advanced anti-cheat system to ensure test integrity.

- **Tasks:**
  - Update Firestore models to include `antiCheatConfig` in `tests` and a `violations` array in `test_sessions`.
  - Add the **Anti-Cheat Settings** section to the test creation/editing form for teachers.
  - Update the test creation/update API endpoints to save the `antiCheatConfig`.
  - Implement client-side logic to detect and log violations (this would typically involve native-like features if on mobile, or browser APIs on web).
  - Enhance Firestore security rules to protect anti-cheat configurations and violation logs.

---

### **Week 8: Final Testing, Documentation, & Deployment**

**Goal:** Prepare the application for production release.

- **Tasks:**
  - Conduct end-to-end testing of all user flows (Admin, Teacher, Student).
  - Perform stress testing on API endpoints and Firestore queries.
  - Review and finalize all documentation, including `README.md`, `firebase-structure.md`, and `actions.md`.
  - Set up production environment variables and configurations.
  - Deploy the application to a hosting provider (e.g., Firebase App Hosting, Vercel).
  - Monitor the live application for any initial issues and prepare for post-launch support.
