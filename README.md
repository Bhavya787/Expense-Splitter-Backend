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
    git clone https://github.com/Bhavya787/Expense-Splitter-Backend.git
    cd Expense-Splitter-Backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

### Environment Variables



```
PORT=3000
MONGODB_URI=mongodb+srv://bhavya22210383:ts7URGdl5jcf4Hhw@splitter.5t7o6gy.mongodb.net/?retryWrites=true&w=majority&appName=Splitter
```


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


## Settlement Calculation Logic

The core of this expense splitter application lies in its ability to accurately calculate individual balances and then simplify the transactions required to settle all debts. This logic is primarily handled within the `controllers/settlementController.js` file.

### 1. Calculating Balances (`calculateBalances` function)

This internal helper function is responsible for determining the net balance for each person involved in the expenses. It iterates through all recorded expenses and performs the following steps:

*   **Tracks Money Paid**: For each expense, it adds the `amount` to the `paidBy` person's balance. This reflects how much money each person has put into the group pot.
*   **Tracks Individual Shares**: For each participant in an expense, it subtracts their `share` from their balance. The interpretation of `share` depends on its `type`:
    *   **`exact`**: The `share` value is taken as an absolute amount that the participant is responsible for.
    *   **`percentage`**: The `share` is treated as a percentage of the total expense `amount`. For example, if an expense is $100 and a participant's share is 25% (type: "percentage"), $25 is subtracted from their balance.
    *   **`share` (unit-based)**: If a participant's share `type` is "share" (e.g., `share: 1`), the `share` value is treated as a unit for proportional division. The expense `amount` is divided among all participants with `type: "share"` based on their respective `share` units. For example, if an expense is $280 and three participants each have `share: 1` of type "share", they will each be responsible for $93.33 (280 / 3).
*   **Handling Undefined Participants**: If an expense is added without specific participants, the system currently assumes an equal split among all people who have ever been involved in any expense (either as `paidBy` or as a `participant`). This is a simplification and ensures that all money is accounted for.

After processing all expenses, the `calculateBalances` function returns an object where keys are person names and values are their net balances. A positive balance means the person is owed money, and a negative balance means the person owes money.

### 2. Simplifying Settlements (`getSettlements` function)

This function takes the balances calculated by `calculateBalances` and determines the most efficient way to settle all debts, minimizing the number of transactions. It employs a common algorithm for debt simplification:

*   **Categorize Creditors and Debtors**: It separates people into two groups:
    *   **Creditors**: Those with a positive balance (owed money).
    *   **Debtors**: Those with a negative balance (owe money).
*   **Sort by Amount**: Both lists are sorted in descending order of the absolute amount they are owed or owe. This helps in efficiently matching large debts/credits.
*   **Iterative Settlement**: The algorithm then iteratively matches the largest debtor with the largest creditor:
    1.  It takes the top debtor and the top creditor.
    2.  It determines the `minAmount` between what the debtor owes and what the creditor is owed.
    3.  A settlement transaction is recorded: the debtor pays the creditor the `minAmount`.
    4.  The `minAmount` is subtracted from both the debtor's outstanding debt and the creditor's outstanding credit.
    5.  If a debtor's debt becomes zero, they are removed from the debtors list. Similarly, if a creditor's credit becomes zero, they are removed from the creditors list.
    6.  This process continues until both the creditors and debtors lists are empty, meaning all debts have been settled.

This approach ensures that the total number of transactions is minimized, making it easier for individuals to settle their accounts. The output is an array of objects, each representing a payment from one person to another, along with the amount.

## Known Limitations or Assumptions

*   **User Authentication/Authorization**: The application currently does not implement user authentication or authorization. Any user can access and modify expenses.
*   **Recurring Expenses**: There is no built-in functionality for handling recurring expenses.
*   **Currency Handling**: All amounts are treated as a single, generic currency. There is no support for multiple currencies or currency conversion.
*   **Participant Management**: People are automatically added to the system when they are involved in an expense (either as `paidBy` or as a `participant`). There is no separate interface for managing a list of users or participants.
*   **

