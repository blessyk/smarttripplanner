# Smart Trip Planner - Backend API Server

This is the Node.js / Express API server for the Smart Trip Planner application. It handles user authentication, admin dashboard statistics, travel destinations, user reviews, and contact message requests.

---

## Getting Started

### 1. Installation
Install the project dependencies:
```bash
npm install
```

### 2. Environment Variables Configuration
Configure your `.env` file in the root of this directory:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_signing_key
NODE_ENV=development
```

### 3. Database Seeding
You must seed the database to populate travel destinations and customer reviews. Run these scripts from this directory:

* **Seed Destinations**:
  ```bash
  node src/scripts/seedDestinations.js
  ```
* **Seed Testimonials**:
  ```bash
  node src/scripts/seedTestimonials.js
  ```

### 4. Running the Server
Start the development server:
```bash
npm start
```
The server will bind to port `5001` (by default) and output connection success logs once it connects to MongoDB.

---

## API Endpoints List

The backend exposes the following API routes:

### Authentication (`/api/auth`)
* `POST /register` - Register a new user
* `POST /login` - Sign in and get a JWT token
* `GET /profile` - Retrieve user profile details (Protected)
* `PUT /profile` - Update profile info (Protected)

### Admin Panel (`/api/admin`)
* `GET /users` - Get paginated & searchable users list (Admin only)
* `GET /users/:id` - Fetch user details by ID (Admin only)
* `DELETE /users/:id` - Delete user account (Admin only)

### Destinations (`/api/destinations`)
* `GET /` - Fetch paginated, searchable, and sorted destinations (Public)
* `GET /:id` - Get specific destination details (Public)
* `POST /` - Add a new destination with multiple images (Admin only)
* `PUT /:id` - Update destination details (Admin only)
* `DELETE /:id` - Delete a destination record (Admin only)

### Testimonials (`/api/testimonials`)
* `GET /` - Fetch client reviews (Public)
* `POST /` - Submit a testimonial (Admin only)
* `DELETE /:id` - Remove a testimonial (Admin only)

### Contact Messages (`/api/contacts`)
* `POST /` - Submit contact enquiry form (Public)
* `GET /` - Retrieve all message submissions (Admin only)
* `DELETE /:id` - Delete message entry (Admin only)

### Uploads (`/api/upload`)
* `POST /` - Upload single file to server directory (Admin only)
