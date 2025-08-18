# Teacher Actions for Ongoing Tests

This document outlines the actions a teacher can perform on tests that are currently in the "Ongoing" tab within the Test Management dashboard. An "Ongoing" test is a test that has been published and is currently active for students.

## Individual Test Actions

When clicking the three-dots menu icon for a single ongoing test, a teacher has the following options:

### 1. View Questions

*   **Action**: Opens the question editor for the test in a read-only mode. The teacher can see all questions and their options but cannot make any changes.
*   **Database Changes**: None. This is a read-only operation and does not alter any data in Firestore.
*   **Purpose**: To allow a teacher to review the exact questions and answers of a live test without the risk of accidentally modifying it.

### 2. Revert to Draft

*   **Action**: Moves the test from the "Ongoing" state back to the "Drafts" tab.
*   **Warning**: This is a destructive and irreversible action for student data.
*   **Database Changes**:
    *   In the `tests` collection, for the specific `test/{testId}` document, the `status` field is updated from `"published"` to `"draft"`.
    *   The system then queries the `test_sessions` collection for all documents where the `test_id` field matches the `testId` being reverted.
    *   All matching `test_sessions` documents are permanently **deleted**. This erases all student submissions, scores, and progress for this test.
*   **Purpose**: This action is intended for situations where a critical error is found in a live test (e.g., wrong answers, significant typos). It allows a teacher to pull the test back, fix the issues, and then republish it. Students will have to start the test over.

### 3. View Results

*   **Action**: Navigates the teacher to the dedicated Test Results page for that specific test.
*   **Database Changes**: Viewing the results page itself does not change any data. However, from this page, a teacher can perform further actions like resetting individual student test sessions.
*   **Purpose**: To enable real-time monitoring of student progress. On the results page, a teacher can see:
    *   Which students have started, are in-progress, or have completed the test.
    *   The current scores for completed submissions.
    *   The status of each student's test session (`in_progress`, `completed`, `expired`, etc.).
    *   From here, the teacher can **reset an individual student's test session** if they encountered a technical issue.

### 4. End Quiz

*   **Action**: Immediately stops the test for all students and moves it to the "Completed" tab.
*   **Warning**: This action cannot be undone.
*   **Database Changes**:
    *   In the `tests` collection, for the specific `test/{testId}` document:
        *   The `status` field is updated to `"completed"`.
        *   The `date_time` field is updated to the current timestamp, effectively marking the test's new end time.
*   **Purpose**: To manually end a test before its originally scheduled end time. This is useful if all students have finished early or if the teacher needs to stop the assessment for any reason.

## Bulk Actions

When one or more ongoing tests are selected using the checkboxes, a teacher can perform the following actions in bulk:

### 1. Revert to Draft

*   **Action**: Moves all selected ongoing tests back to the "Drafts" tab.
*   **Database Changes**: For each selected `testId`, this performs the same operations as the individual "Revert to Draft" action:
    *   Updates the test's `status` to `"draft"`.
    *   Deletes all associated documents from the `test_sessions` collection.

### 2. End Now

*   **Action**: Immediately ends all selected tests and moves them to the "Completed" tab.
*   **Database Changes**: For each selected `testId`, this performs the same operations as the individual "End Quiz" action:
    *   Updates the test's `status` to `"completed"`.
    *   Updates the test's `date_time` to the current timestamp.