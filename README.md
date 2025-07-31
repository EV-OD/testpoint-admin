# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Firebase Setup Instructions

To connect this application to your Firebase project, please follow these steps in your [Firebase Console](https://console.firebase.google.com/).

### 1. Find Your Firebase Project

You are already working inside a Firebase project. The necessary configuration has been automatically added to `src/lib/firebase.ts`.

### 2. Enable Email/Password Authentication

For the login system to work, you need to enable the Email/Password sign-in provider.

1.  In the Firebase Console, navigate to the **Authentication** section from the left-hand menu.
2.  Go to the **Sign-in method** tab.
3.  Click on **Email/Password** from the list of providers.
4.  **Enable** the provider and click **Save**.

### 3. Create an Admin User

The application is designed for administrative access, so there is no public sign-up page. You must create your first user manually.

1.  Go to the **Authentication** section in your Firebase console.
2.  Click on the **Users** tab.
3.  Click the **Add user** button.
4.  Enter an **email address** and a **password** (must be at least 6 characters).
5.  Click **Add user**.

You can now use these credentials to log into your application.

Once you've completed these steps, you can run the application, log in with the user you created, and begin managing your app.
