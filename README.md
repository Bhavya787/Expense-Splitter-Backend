# Expense Splitter Backend

This is a backend system for an expense-splitting application, built with Node.js, Express.js, and MongoDB. It allows users to track expenses, calculate balances, and simplify settlements among groups of people.

## Features

*   **Expense Tracking**: Add, view, update, and delete expenses with details like description, amount, who paid, and participants' shares.
*   **Settlement Calculations**: Automatically calculate how much each person has spent versus their fair share, determine who owes money to whom, and provide simplified settlements to minimize transactions.
*   **Data Validation & Error Handling**: Robust input validation and graceful error handling with appropriate HTTP status codes.
*   **RESTful API**: Exposes a set of RESTful API endpoints for seamless integration with frontend applications.

## Technologies Used

*   **Node.js**: JavaScript runtime environment.
*   **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
*   **Mongoose**: MongoDB object data modeling (ODM) for Node.js.
*   **MongoDB Atlas**: Cloud-hosted MongoDB database.
*   **Dotenv**: Loads environment variables from a `.env` file.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (Node Package Manager)
*   MongoDB Atlas account (for cloud database) or local MongoDB instance

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd expense-splitter-backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root of the project and add the following environment variables:

```
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string_here
```

*   `PORT`: The port on which the server will run (e.g., `3000`).
*   `MONGODB_URI`: Your MongoDB Atlas connection string. You can obtain this from your MongoDB Atlas dashboard. Remember to replace `<username>` and `<password>` with your actual database user credentials.

### Running the Application

To start the development server:

```bash
npm start
```

The API will be running at `http://localhost:3000` (or the port you specified in `PORT`).

## API Endpoints

The following API endpoints are available:

### Expense Management

*   **GET /api/expenses**
    *   Retrieves all expenses.
*   **POST /api/expenses**
    *   Adds a new expense.
    *   **Request Body Example:**
        ```json
        {
            "description": "Dinner at restaurant",
            "amount": 60.00,
            "paidBy": "Shantanu",
            "participants": [
                { "name": "Shantanu", "share": 20.00, "type": "exact" },
                { "name": "Sanket", "share": 20.00, "type": "exact" },
                { "name": "Om", "share": 20.00, "type": "exact" }
            ]
        }
        ```
*   **PUT /api/expenses/:id**
    *   Updates an existing expense by ID.
    *   **Request Body Example:**
        ```json
        {
            "amount": 350.00
        }
        ```
*   **DELETE /api/expenses/:id**
    *   Deletes an expense by ID.

### Settlement Calculations

*   **GET /api/people**
    *   Retrieves a list of all people involved in expenses.
*   **GET /api/balances**
    *   Retrieves the current balance for each person (how much they owe or are owed).
*   **GET /api/settlements**
    *   Calculates and retrieves simplified settlements to minimize the number of transactions needed.

## Postman Collection

A Postman collection is provided to easily test all API endpoints. You can find the `Expense_Splitter_APIs.postman_collection.json` file in the root directory of this project.





