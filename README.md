# Descope Node M2M Sample App

This is a sample Node.js application demonstrating Machine-to-Machine (M2M) authentication using Descope's client credentials flow. It allows you to exchange an access key for a JWT and call protected APIs.

## 🚀 Setup Instructions

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd node-m2m-sample
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root with the following variables:
   ```env
   DESCOPE_PROJECT_ID=your_descope_project_id
   DESCOPE_ACCESS_KEY=your_descope_management_access_key
   PORT=3000 # Optional, defaults to 3000
   ```

   - `DESCOPE_PROJECT_ID`: Your Descope project ID (from the Descope console)
   - `DESCOPE_ACCESS_KEY`: Your Descope management access key
   - `PORT`: (Optional) Port to run the server on

4. **Start the app:**
   ```sh
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Open in your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 🛠 Usage Example

- Enter your Project ID and Access Key in the UI.
- Select or enter the scopes you want to request.
- Click **Get M2M Token** to exchange your access key for a JWT.
- View the raw and decoded JWT, expiry countdown, and important claims.
- Use the **Try Protected API** button to call a protected endpoint with your JWT.

---

## 📖 API Documentation

### `POST /m2m/token`
**Description:** Exchange a Descope access key for a JWT using the M2M (client credentials) flow.

**Request Body:**
```json
{
  "projectId": "string (optional, overrides env)",
  "accessKey": "string (optional, overrides env)",
  "scopes": ["scope1", "scope2", ...] // optional
}
```

**Response:**
- `200 OK` (success)
```json
{
  "success": true,
  "jwt": "<JWT string>",
  "decodedPayload": { ... },
  "decodedHeader": { ... }
}
```
- `401 Unauthorized` (error)
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

---

### `POST /api/protected`
**Description:** Protected endpoint. Verifies the JWT and returns its claims.

**Headers:**
- `Authorization: Bearer <JWT>`

**Response:**
- `200 OK` (success)
```json
{
  "success": true,
  "message": "Protected API call succeeded!",
  "claims": { ... }
}
```
- `401 Unauthorized` (error)
```json
{
  "success": false,
  "error": "JWT verification failed: ..."
}
```

---

### `POST /api/user`
**Description:** Protected endpoint. Requires the JWT to have the `read:data` scope.

**Headers:**
- `Authorization: Bearer <JWT>`

**Response:**
- `200 OK` (success)
```json
{
  "success": true,
  "message": "User API call succeeded!",
  "claims": { ... }
}
```
- `403 Forbidden` (missing scope)
```json
{
  "success": false,
  "error": "Missing required scope: 'read:data'"
}
```

---

### `POST /api/admin`
**Description:** Protected endpoint. Requires the JWT to have the `admin` scope.

**Headers:**
- `Authorization: Bearer <JWT>`

**Response:**
- `200 OK` (success)
```json
{
  "success": true,
  "message": "Admin API call succeeded!",
  "claims": { ... }
}
```
- `403 Forbidden` (missing scope)
```json
{
  "success": false,
  "error": "Missing required scope: 'admin'"
}
```

---

## 📝 Notes
- The access key is never sent to or stored on the server except for the duration of the request.
- This app is for demo purposes. For production, see security best practices in the code comments and Descope documentation.
- The `/m2m/token` endpoint is specifically for M2M (machine-to-machine) authentication and follows best practices for naming and usage.

---

## 🔐 Setting Up Roles and Permissions in Descope for M2M Scopes

To use scopes such as `read:data`, `write:data`, or to enforce role-based access like `admin` or `user` with your access keys and JWTs, you must define the following in your Descope project:

- **Roles:** `admin`, `user`
- **Permissions:** `read:data`, `write:data`

These roles and permissions are attached to your access keys and will be reflected in the JWT claims, allowing your application to enforce authorization based on scopes and roles.

### 1. Create Roles in the Descope Console

1. Log in to the [Descope Console](https://console.descope.com/).
2. Navigate to **Settings** > **Roles & Permissions**.
3. Click **Add Role** (the + button).
4. Create the following roles:
   - `admin`
   - `user`
5. Optionally, add a description for each role.
6. Save the roles.

### 2. Define Permissions

1. In the same **Roles & Permissions** section, define the following permissions:
   - `read:data`
   - `write:data`
2. Assign these permissions to the roles as appropriate. For example:
   - The `admin` role can have both `read:data` and `write:data` permissions.
   - The `user` role can have only `read:data` permission, or both, depending on your needs.

### 3. Attach Roles to Access Keys

1. Go to **Access Keys** in the Descope Console.
2. Create a new access key or edit an existing one.
3. In the access key configuration, assign one or more roles (`admin` or `user`) to the key. You can also associate tenants if needed.
4. Save the access key. Copy the key value for use in your app.

### 4. Use the Access Key in Your App

- When you exchange the access key for a JWT (using `/m2m/token`), the roles and permissions you assigned will be included in the JWT claims (e.g., as `scope`, `scopes`, `role`, or `roles`).
- Your backend can then enforce access control by checking for the required scopes/roles in the JWT claims.

### 5. Example: Enforcing Roles and Scopes in Your App

If your API requires the `admin` role, ensure the JWT contains `admin` in its `role` or `roles` claim. If your API requires the `read:data` permission, ensure the JWT contains `read:data` in its `scope` or `scopes` claim. The sample app already demonstrates this in the `/api/admin` and `/api/user` endpoints.

---

**For more details, see:**
- [Descope Docs: Roles & Permissions](https://docs.descope.com/roles-permissions/)
- [Descope Docs: M2M Access Keys](https://docs.descope.com/m2m-access-keys/)
- [Descope Docs: Security Best Practices](https://docs.descope.com/security-best-practices/)

---

## 📚 Resources
- [Descope Docs: M2M Access Keys](https://docs.descope.com/management/m2m-access-keys/sdks#exchange-access-keys)
- [Descope Node SDK](https://www.npmjs.com/package/@descope/node-sdk) 