# AMIGOS Connect

AMIGOS Connect is a centralized, cloud-based platform built to help businesses effectively manage staff timesheets, monitor active shifts, handle leave requests, and calculate dynamic payrolls seamlessly. 

The platform serves two primary perspectives: the **Owner/Manager Portal** and the **Employee Portal**.

## 👑 Owner / Manager Features

Access the owner dashboard by clicking **Owner / Manager** on the login screen and entering the master password.

* **Dashboard Overview:** Get a birds-eye view of your business. View total registered staff, active "clocked-in" sessions, pending leave & advance requests, and a visual Hours Distribution bar chart (toggleable between Weekly and Monthly).
* **Live Clock:** See exactly who is working in real time. Displays active shifts with a ticking chronometer, accumulated earnings for the ongoing session, and a record of completed shifts for the day.
* **Timesheets (Weekly/Monthly):** Review every clock-in and clock-out event by staff. Toggle between Weekly and Monthly views. Easily delete erroneous logs and export the view directly to a CSV file.
* **Payroll Calculation:** Dynamic payroll calculating system that automatically extracts an **Hourly Rate** from a given **Per Day Salary** and standard shift hours. 
  * **Overtime Handling:** Automatically calculates overtime hours dynamically if a shift exceeds the employee's standard hours, paying for those extra hours seamlessly at their standard hourly rate.
  * **Net Pay:** Automatically deducts any approved/paid Salary Advances from the Gross Pay to give you a pristine Net Pay number.
  * **Exports:** Toggle between Weekly/Monthly pay cycles and export a highly detailed Payroll CSV tracking Days Worked, Regular Hours, OT Hours, Total Hours, Gross Pay, Advances, and Net Pay.
* **Leave Management:** Review leave requests submitted by staff members. Categorizes requests cleanly into 'Pending', 'Approved', and 'Declined'.
* **Salary Advances:** A dedicated portal to manage advance requests from staff. Mark requests as 'Paid' to automatically inject the deduction into the staff member's next payroll cycle.
* **Staff Management (CRUD):** 
  * **Add Staff:** Assign an employee a PIN, Role, Branch, Payment Cycle (Weekly/Monthly), Daily Salary, and Standard Hrs/Day.
  * **Edit/Update:** Quickly edit an existing employee's rates, branch, or roles without losing their timesheet history.
  * **Search:** Built-in search bar to quickly filter and find employees by name.
* **Branch Filtering:** A global top-bar dropdown allowing the owner to filter the entire dashboard (Staff, Payroll, Timesheets, Live Clock) to reflect data for a specific branch (e.g., Mens, Womens, Crazo, Warehouse).
* **Settings Configuration:** 
  * Change the default master password.
  * Globally enable or disable the Leave Requests feature for all staff.
  * Create, edit, and safely delete Store Branches for future expansion.

---

## 🧑‍💼 Employee Features

Access the employee dashboard by clicking **Employee Login** on the login screen and entering the unique 4-digit PIN assigned by the Owner.

* **Live Shift Tracking:** An intuitive green "Clock In" and red "Clock Out" button. Once clocked in, employees can track their running shift chronometer in real-time right on their dashboard.
* **Performance Analytics:** Employees can independently monitor their total hours worked and view a visual **Daily Earnings Bar Chart** summarizing their income per shift.
* **Shift History:** Quick access to the most recently completed shifts, along with individual session lengths and timestamps.
* **Leave Application:** A built-in form to request days off. Employees can select date ranges, specify a type of leave (Casual, Sick, Emergency), and add brief reasons. They can also track the status (Pending/Approved/Declined) directly from their portal.
* **Advance Requests:** A form for employees to request a salary advance securely. They can specify an amount, give a reason, and track whether the owner has approved/paid it.
* **Intelligent Protections:** Prevents employees from accidentally clocking in on a day they have an approved leave.

---

## 🚀 Technical Configuration

* **Database:** Powered by Firebase Firestore (`amigos_store`). Automatically provisions NoSQL documents.
* **State Persistence:** Persistent login sessions via `localStorage` allowing the user to stay signed in between app reloads.
* **Data Management:** Cloud-synced data is dynamically cached locally, and auto-cleaned based on a 90-day Time-To-Live (TTL) implementation to avoid database buildup.
* **PWA Ready:** Configured to be installable on mobile devices via a Web App Manifest and a robust Service Worker utilizing Network-First caching logic.

## 🔧 Setup & Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the Vite development server.
4. Update Firebase Configurations in `App.jsx` if setting up a new separate Firestore environment.