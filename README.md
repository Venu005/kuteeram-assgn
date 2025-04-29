# Rice Trading Platform - Project Overview

This project is a backend application for a rice trading platform connecting rice mill sellers, buyers, and lorry drivers for transportation. It facilitates product listing, bidding, order management, payment processing (simulated), and delivery logistics, incorporating real-time notifications and location-based features.

## Core Features

*   **User Roles:** Distinct functionalities for Sellers, Buyers, and Lorry Drivers.
*   **Authentication & Authorization:** Secure registration and login using JWT tokens stored in cookies. Role-based access control protects endpoints.
*   **Product Management (Seller):** Sellers can list rice products ([`src/models/product.model.ts`](src/models/product.model.ts)), manage their availability, update details, and view their inventory.
*   **Product Discovery (Buyer):** Buyers can search for available products based on type and quantity ([`src/buyer/buyer.controller.ts#L16`](src/buyer/buyer.controller.ts)). Search results anonymize seller details initially.
*   **Bidding System:** Buyers can place bids ([`src/models/bid.model.ts`](src/models/bid.model.ts)) on products. Bids meeting or exceeding the seller's price are auto-accepted. Lower bids notify the seller in real-time via Socket.IO.
*   **Order Management:** A comprehensive order lifecycle ([`src/models/order.model.ts`](src/models/order.model.ts)) tracked via status updates: `pending` -> `paid` -> `shipped` -> `delivered`.
*   **Payment Processing (Simulated):** Buyers can mark orders as paid ([`src/buyer/buyer.controller.ts#L168`](src/buyer/buyer.controller.ts)). (Note: Actual payment gateway integration is not implemented).
*   **Delivery Logistics:**
    *   **Lorry Assignment:** Paid orders become visible to nearby, available lorry drivers ([`src/lorry/lorry.controller.ts#L168`](src/lorry/lorry.controller.ts)).
    *   **Order Acceptance:** Lorry drivers can accept orders, making them unavailable for other tasks ([`src/lorry/lorry.controller.ts#L11`](src/lorry/lorry.controller.ts)).
    *   **Pickup Verification:** Sellers verify the lorry driver pickup using a time-sensitive OTP ([`src/seller/seller.controller.ts#L131`](src/seller/seller.controller.ts)). Order status changes to `shipped`.
    *   **Delivery Confirmation:** Buyers confirm successful delivery ([`src/buyer/buyer.controller.ts#L196`](src/buyer/buyer.controller.ts)). Order status changes to `delivered`, and the lorry becomes available again.
*   **Location-Based Services:** Utilizes GeoJSON and MongoDB's geospatial queries (`$geoNear`) for:
    *   Finding nearby orders for Lorry drivers.
    *   Finding nearby rice mills for Buyers ([`src/buyer/buyer.controller.ts#L348`](src/buyer/buyer.controller.ts)).
*   **Real-time Notifications (Socket.IO):** Sellers receive instant notifications for new bids and auto-accepted bids ([`src/server.ts`](src/server.ts), [`src/buyer/buyer.controller.ts#L156`](src/buyer/buyer.controller.ts)).
*   **Profile Management:** All user types can view and update their profile information.
*   **Dashboard (Seller):** Sellers have a dashboard summarizing stock levels, recent orders, and orders by status ([`src/seller/seller.controller.ts#L71`](src/seller/seller.controller.ts)).

## Technology Stack

*   **Backend:** Node.js, Express.js
*   **Language:** TypeScript
*   **Database:** MongoDB with Mongoose ODM (utilizing geospatial features)
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs (password hashing)
*   **Real-time:** Socket.IO
*   **Validation:** express-validator
*   **Environment Variables:** dotenv
*   **Other:** cors, cookie-parser

## Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    *   Copy the contents of a sample `.env` file or create one in the root directory.
    *   Fill in the required environment variables (see [Environment Variables](#environment-variables) section).
4.  **Compile TypeScript:**
    ```bash
    npm run build
    ```
5.  **Run the application:**
    *   **Development:** `npm run dev` (uses nodemon for auto-reloading)
    *   **Production:** `npm start` (runs the compiled JavaScript from the `dist` folder)

## Core Application Flow

1.  **Registration & Login:**
    *   Users (Seller, Buyer, Lorry) register via specific endpoints (`/api/auth/register/...`). Passwords are hashed.
    *   Users log in (`/api/auth/login`) with phone and password.
    *   Upon successful login, a JWT token is generated and set as an HTTP-only cookie.
2.  **Seller: Listing a Product:**
    *   Authenticated Seller sends a POST request to `/api/products` with product details (type, quantity, price).
    *   The product is created with `isAvailable: true` by default.
3.  **Buyer: Searching and Bidding:**
    *   Authenticated Buyer sends a GET request to `/api/buyer/search` with optional query parameters (`productType`, `quantity`).
    *   The API returns a list of matching, available products with anonymized seller info.
    *   Buyer chooses a product and sends a POST request to `/api/buyer/bid` with `productId` and `bidPrice`.
4.  **Bid Processing & Order Creation:**
    *   **If `bidPrice` >= `product.price`:**
        *   Bid status becomes `accepted`.
        *   Product `isAvailable` becomes `false`.
        *   An Order is created with `status: pending`.
        *   A pickup OTP is generated for the order.
        *   Seller is notified via Socket.IO (`bidAccepted`).
        *   Buyer receives confirmation with Order details.
    *   **If `bidPrice` < `product.price`:**
        *   Bid status remains `pending`.
        *   Seller is notified via Socket.IO (`newBid`).
        *   Buyer receives confirmation that the bid was placed.
5.  **Payment:**
    *   Buyer sends a POST request to `/api/buyer/payment` with `orderId`.
    *   Order status is updated to `paid`. (Simulated payment).
6.  **Lorry Assignment & Pickup:**
    *   Available Lorry drivers periodically check for nearby paid orders via GET `/api/lorry/nearby-orders`.
    *   A Lorry driver accepts an order via POST `/api/lorry/accept-order` with `orderId`.
        *   Order is assigned the `lorryId`.
        *   Lorry `isAvailable` becomes `false`.
    *   Lorry driver goes to the seller's location for pickup.
    *   Seller verifies the driver using the pickup OTP via POST `/api/seller/verify-pickup` with `orderId` and `otp`.
        *   If OTP is valid and not expired: Order `isPicked` becomes `true`, status becomes `shipped`.
        *   If OTP is expired: A new OTP is generated, and an error is returned.
        *   If OTP is invalid: An error is returned.
7.  **Delivery Confirmation:**
    *   Lorry driver delivers the product to the buyer.
    *   Buyer confirms delivery via POST `/api/buyer/confirm-delivery` with `orderId`.
        *   Order `isDelivered` becomes `true`, status becomes `delivered`.
        *   Associated Lorry `isAvailable` becomes `true`.

## API Endpoints Overview

*   **Auth:** `/api/auth/` (register, login, logout)
*   **Seller:** `/api/seller/` (profile, dashboard, verify-pickup)
*   **Buyer:** `/api/buyer/` (profile, search, bid, payment, confirm-delivery, orders, nearby-mills)
*   **Lorry:** `/api/lorry/` (profile, location, nearby-orders, accept-order, available)
*   **Products:** `/api/products/` (CRUD operations for sellers, get product details for buyers/lorries)

*(Refer to [`src/routes/`](src/routes/), [`src/seller/seller.route.ts`](src/seller/seller.route.ts), [`src/buyer/buyer.route.ts`](src/buyer/buyer.route.ts), [`src/lorry/lorry.route.ts`](src/lorry/lorry.route.ts) for detailed routes and associated controllers)*


