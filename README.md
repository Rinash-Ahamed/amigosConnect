# AMIGOS Connect

AMIGOS Connect is a centralized, cloud-based platform built to help businesses effectively manage staff timesheets, monitor active shifts, handle leave requests, and calculate dynamic payrolls seamlessly. 

The platform serves two primary perspectives: the **Owner/Manager Portal** and the **Employee Portal**.

## 👑 Owner / Manager Features

Access the owner dashboard by clicking **Owner / Manager** on the login screen and entering the master password (`admin123` by default).

* **Dashboard Overview:** Get a birds-eye view of your business. View total registered staff, active "clocked-in" sessions, pending leave requests, and a visual bar chart of weekly hours distributed across your team.
* **Live Clock:** See exactly who is working in real time. Displays active shifts with a ticking chronometer, accumulated earnings for the ongoing session, and a record of completed shifts for the day.
* **Timesheets (Weekly/Monthly):** Review every clock-in and clock-out event by staff. Toggle between Weekly and Monthly views. Easily delete erroneous logs and export the view directly to a CSV file.
* **Payroll Calculation:** Dynamic payroll calculating system using a combination of **Per Day Salaries** and **Hourly Rates**. Calculates days worked and hours tracked independently to generate a unified payout amount. Toggle between Weekly/Monthly pay cycles and export a complete CSV.
* **Leave Management:** Review leave requests submitted by staff members. Categorizes requests cleanly into 'Pending', 'Approved', and 'Declined'.
* **Staff Management (CRUD):** 
  * **Add Staff:** Assign an employee a PIN, Role, Branch, Payment Cycle (Weekly/Monthly), Daily Salary, and Hourly Rate.
  * **Edit/Update:** Quickly edit an existing employee's rates, branch, or roles without losing their timesheet history.
  * **Search:** Built-in search bar to quickly filter and find employees by name.
* **Branch Filtering:** A global top-bar dropdown allowing the owner to filter the entire dashboard (Staff, Payroll, Timesheets, Live Clock) to reflect data for a specific branch (e.g., Mens, Womens, Crazo, Warehouse).
* **Settings Configuration:** 
  * Change the default master password.
  * Globally enable or disable the Leave Requests feature for all staff.
  * Create, add, and manage completely new Store Branches for future expansion.

---

## 🧑‍💼 Employee Features

Access the employee dashboard by clicking **Employee Login** on the login screen and entering the unique 4-digit PIN assigned by the manager.

* **Live Shift Tracking:** An intuitive green "Clock In" and red "Clock Out" button. Once clocked in, employees can track their running shift chronometer in real-time right on their dashboard.
* **Performance Analytics:** Employees can independently monitor their total hours worked and total calculated earnings for the current week.
* **Shift History:** Quick access to the most recently completed shifts, along with individual session lengths and timestamps.
* **Leave Application:** A built-in form to request days off. Employees can select date ranges, specify a type of leave (Casual, Sick, Emergency), and add brief reasons. They can also track the status (Pending/Approved/Declined) directly from their portal.
* **Intelligent Protections:** Prevents employees from accidentally clocking in on a day they have an approved leave.

---

## 🚀 Technical Configuration

* **Database:** Powered by Firebase Firestore (`amigos_store`). Automatically provisions NoSQL documents.
* **Offline Fallbacks / Caching:** Cloud-synced data is dynamically cached locally, and auto-cleaned based on a 90-day Time-To-Live (TTL) implementation to avoid performance clogs.
* **PWA Ready:** Configured to be installable on mobile devices via a Web App Manifest and Service Worker implementation.

## 🔧 Setup & Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the Vite development server.
4. Update Firebase Configurations in `App.jsx` if setting up a new separate Firestore environment.