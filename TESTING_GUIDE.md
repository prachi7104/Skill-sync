# Local Verification Guide

This guide explains how to use the `test-before-deploy.ps1` script to verify your application before deploying to Vercel.

## Prerequisites

1.  **Local Server Running**:
    Ensure your Next.js app is running locally:
    ```bash
    npm run dev
    ```

2.  **Valid Session Token**:
    You need a valid `next-auth.session-token` to authenticate the API requests.
    - Open your browser and log in to `http://localhost:3000`.
    - Open Developer Tools (F12) > **Application** > **Cookies**.
    - Find `http://localhost:3000`.
    - Copy the value of `next-auth.session-token`.

## Running the Test

Open a PowerShell terminal in your project root and run:

```powershell
.\test-before-deploy.ps1 -SessionToken "YOUR_COPIED_TOKEN_VALUE"
```

## Interpreting Results

The script runs 5 key tests:

1.  **Connectivity Check**: Verifies DB connection by fetching dashboard stats.
2.  **Read Profile**: Verifies that the logged-in user's profile can be fetched.
3.  **Update Profile**: Simulates saving profile data (like during onboarding).
4.  **Resume Upload**: Uploads a dummy PDF to Cloudinary and checks if it triggers a parse job.
5.  **Sandbox Analysis**: Submits a sample JD and checks if the AI scoring works.

### Pass/Fail criteria

-   **PASS**: The API returned a 200-series status code and a JSON response with `success: true`.
-   **FAIL**: The API returned an error code (400, 500) or structured error JSON.

## Manual Verification Verification

After the script runs, verify these items manually if needed:

-   **Database**: Check if the `students` table has the updated skills and resume URL.
-   **Cloudinary**: Check if the "resumes" folder has a new file.
-   **Vercel Dashboard**: (After deployment) Check the Function logs for any `console.error` logs if a step fails in production.
