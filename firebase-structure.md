# Firebase Firestore Data Structure

This document outlines the current data structure used in Firestore for the TestPoint application. This guide reflects the implemented system and is intended to help developers understand how data is stored and managed.

## Root Collections

The database consists of four primary root collections:

1. `users` - User profiles and authentication data
2. `groups` - Class/group management 
3. `tests` - Test definitions with questions subcollection
4. `test_sessions` - Individual student test-taking sessions

**Note**: The Firestore rules also reference a `test_submissions` collection, but this appears to be an alias or alternative reference to `test_sessions` for completed tests.

---

## 1. `users` Collection

This collection stores user profile information. The document ID for each user is their Firebase Authentication UID.

### Document Structure: `users/{userId}`

```json
{
  "name": "String",
  "email": "String", 
  "role": "String"
}
```

### Field Descriptions:

- **`name`**: (String) The full name of the user (e.g., "John Doe").
- **`email`**: (String) The user's email address. Unique identifier from Firebase Auth.
- **`role`**: (String) User permission level. Possible values:
  - `"admin"`: Full system access and management capabilities
  - `"teacher"`: Can create groups, tests, and view student results
  - `"student"`: Can take assigned tests and view results

---

## 2. `groups` Collection

This collection stores class/group information for organizing students and assigning tests.

### Document Structure: `groups/{groupId}`

```json
{
  "name": "String",
  "userIds": ["Array<String>"],
  "created_at": "Timestamp"
}
```

### Field Descriptions:

- **`name`**: (String) The name of the group (e.g., "Grade 10 Math Class", "Advanced Physics").
- **`userIds`**: (Array of Strings) List of Firebase Authentication UIDs of group members.
- **`created_at`**: (Timestamp) When the group was created.

---

## 3. `tests` Collection

This collection stores test definitions created by teachers.

### Document Structure: `tests/{testId}`

```json
{
  "name": "String",
  "group_id": "String", 
  "time_limit": "Number",
  "question_count": "Number",
  "date_time": "Timestamp",
  "test_maker": "String",
  "created_at": "Timestamp",
  "status": "String"
}
```

### Field Descriptions:

- **`name`**: (String) Test title (e.g., "Final Exam - Algebra II").
- **`group_id`**: (String) Reference to `groups` collection document ID.
- **`time_limit`**: (Number) Test duration in minutes (5-300 range).
- **`question_count`**: (Number) Total questions in test (auto-calculated).
- **`date_time`**: (Timestamp) Scheduled test start date and time.
- **`test_maker`**: (String) Firebase UID of the teacher who created the test.
- **`created_at`**: (Timestamp) Test creation timestamp.
- **`status`**: (String) Test lifecycle status:
  - `"draft"`: Being created/edited, not visible to students
  - `"published"`: Available to students at scheduled time
  - `"completed"`: Past end time, results available

### Subcollections

#### `questions` Subcollection

Each test document contains a `questions` subcollection with MCQ data.

##### Document Structure: `tests/{testId}/questions/{questionId}`

```json
{
  "text": "String",
  "options": [
    {
      "id": "String", 
      "text": "String"
    }
  ],
  "correctOptionIndex": "Number",
  "created_at": "Timestamp"
}
```

##### Field Descriptions:

- **`text`**: (String) Question text (10-500 characters).
- **`options`**: (Array of Objects) Answer choices:
  - **`id`**: (String) Unique option identifier
  - **`text`**: (String) Answer option text
- **`correctOptionIndex`**: (Number) The index of the correct option in the `options` array.
- **`created_at`**: (Timestamp) Question creation time

---

## 4. `test_sessions` Collection

This collection tracks individual student test-taking sessions with comprehensive monitoring.

### Document Structure: `test_sessions/{sessionId}`

```json
{
  "test_id": "String",
  "student_id": "String", 
  "start_time": "Timestamp",
  "end_time": "Timestamp",
  "final_score": "Number",
  "status": "String",
  "answers": {
    "questionId1": {
      "selected_answer_index": "Number",
      "is_correct": "Boolean"
    }
  }
}
```

### Field Descriptions:

- **`test_id`**: (String) Reference to parent test document
- **`student_id`**: (String) Firebase UID of test taker
- **`start_time`**: (Timestamp) Test session start time
- **`end_time`**: (Timestamp) Test completion/submission time
- **`final_score`**: (Number) Calculated score percentage (0-100)
- **`status`**: (String) Session state:
  - `"not_started"`: Session created but not begun  
  - `"in_progress"`: Student actively taking test
  - `"completed"`: Test finished normally and graded
  - `"submitted"`: Test submitted by student
  - `"expired"`: Test exceeded time limit
- **`answers`**: (Object) Student responses mapped by question ID:
    - **`selected_answer_index`**: (Number) Index of chosen option
    - **`is_correct`**: (Boolean) Whether the selected answer was correct
