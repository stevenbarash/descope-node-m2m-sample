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
- Click **Get M2M Token** to exchange your access key for a JWT.
- View the raw and decoded JWT, expiry countdown, and important claims.
- Use the **Try Protected API** button to call a protected endpoint with your JWT.

---

## 📖 API Documentation

### `POST /mgmt`
**Description:** Exchange a Descope access key for a JWT.

**Request Body:**
```json
{
  "projectId": "string (optional, overrides env)",
  "accessKey": "string (optional, overrides env)"
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

## 📝 Notes
- The access key is never sent to or stored on the server except for the duration of the request.
- This app is for demo purposes. For production, see security best practices in the code comments and Descope documentation.

---

## 📚 Resources
- [Descope Docs: M2M Access Keys](https://docs.descope.com/management/m2m-access-keys/sdks#exchange-access-keys)
- [Descope Node SDK](https://www.npmjs.com/package/@descope/node-sdk) 