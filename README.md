# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase Setup Instructions

To connect this application to your Supabase project, please follow these steps in your [Supabase Dashboard](https://supabase.com/dashboard).

### 1. Create a Supabase Project

If you haven't already, create a new project on Supabase.

### 2. Configure Environment Variables

Your application needs to know how to connect to your Supabase project.

1.  Go to your project's **Settings**.
2.  Click on **API**.
3.  Find your **Project URL** and **anon (public) key**.
4.  Open the `.env.local` file in this project.
5.  Set the `NEXT_PUBLIC_SUPABASE_URL` to your Project URL.
6.  Set the `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your anon (public) key.

Your `.env.local` file should look like this:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

### 3. Configure Authentication Settings

Next, you need to configure the authentication provider and redirect URLs.

1.  Go to the **Authentication** section in your Supabase dashboard.
2.  Under **Configuration**, click on **Providers**.
3.  Ensure the **Email** provider is enabled. For this demo, it's recommended to turn **off** the "Confirm email" option for easier testing.
4.  Still in the **Authentication** -> **Configuration** section, go to **URL Configuration**.
5.  Set your **Site URL** to your development server address. For this project, it is `http://localhost:9002`.
6.  Add `http://localhost:9002/auth/callback` to the **Redirect URLs** list.

### 4. Set up the Database Schema

This application requires specific tables in your database.

1.  Go to the **SQL Editor** in your Supabase dashboard.
2.  Click on **New query**.
3.  Open the file `supabase/migrations/20240730120000_init.sql` from this project.
4.  Copy the entire content of the file.
5.  Paste the content into the SQL editor in your Supabase dashboard.
6.  Click **Run**. This will create all the necessary tables, relationships, and security policies.


### 5. Create an Admin User

Finally, you need an admin user to log in with.

1.  Go to the **Authentication** section.
2.  Click on **Users**.
3.  Click **Invite** and create a new user with an email and a password.
4.  After the user is created, go to the **Table Editor** and select the `profiles` table.
5.  Find the row for the user you just created and change their `role` to `admin`.

Once you've completed these steps, you should be able to run the application, and all data will be fetched from and saved to your Supabase project.
