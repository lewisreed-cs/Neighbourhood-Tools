# Neighbourhood Tools Project - Backend Summary

## Project Goal

Build a tool-sharing system for residents where:

- Residents own tools
- Residents can borrow tools from other residents
- Tools can be loaned and returned
- Tool availability is tracked

---

# Architecture

## Backend

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core 8.0.12
- SQLite database (`tools.db`)

## Project Structure

```text
Neighbourhood-Tools
│
├── ToolLibraryApi
│   ├── Controllers
│   ├── Data
│   ├── DTOs
│   ├── Models
│   ├── Migrations
│   └── tools.db
│
└── Frontend (Angular - later)
```

---

# Database Design

## Resident

```csharp
Id
Name
Email
PhoneNumber
```

### Business Reasoning

Represents a resident of the community.

---

## Tool

```csharp
Id
Name
Description
Weight
Status
OwnerId
```

### Business Reasoning

- Every tool belongs to a resident.
- Status tracks whether a tool can currently be borrowed.
- Tool price was intentionally excluded because this is a community sharing system rather than a rental system.

Possible Status Values:

```text
Available
On Loan
```

---

## Loan

```csharp
Id
ToolId
BorrowerId
LoanDate
ReturnDate
```

### Business Reasoning

Stores borrowing history.

Without a Loan table, only the current owner would be known.

With a Loan table:

```text
Hammer borrowed by Lewis
Returned

Hammer borrowed by Alex
Returned
```

can be tracked historically.

---

# Entity Relationships

## Resident → Tool

```text
Resident (1)
    |
    |
    *
Tool
```

One resident owns many tools.

---

## Resident → Loan

```text
Resident (1)
    |
    |
    *
Loan
```

One resident can borrow many tools.

---

## Tool → Loan

```text
Tool (1)
   |
   |
   *
Loan
```

One tool can have many loans throughout its lifetime.

---

# Navigation Properties

## Resident

```csharp
public ICollection<Tool> Tools { get; set; } = [];
public ICollection<Loan> Loans { get; set; } = [];
```

---

## Tool

```csharp
public Resident? Owner { get; set; }
```

---

## Loan

```csharp
public Tool? Tool { get; set; }
public Resident? Borrower { get; set; }
```

### Why Navigation Properties?

They allow access to related entities without manually writing joins.

Examples:

```csharp
tool.Owner
resident.Tools
loan.Tool
loan.Borrower
```

---

# DTOs

DTOs (Data Transfer Objects) were introduced to separate API inputs from database entities.

---

## Create DTOs

```text
CreateToolDto
CreateResidentDto
CreateLoanDto
```

### Reason

Prevents users supplying database-managed values.

Example of data that should not come from the client:

```json
{
    "id": 999
}
```

Database IDs should be generated automatically.

---

## Update DTOs

```text
UpdateToolDto
UpdateResidentDto
UpdateLoanDto
```

### Reason

Support partial updates using PATCH.

Example:

```json
{
    "name": "Updated Hammer"
}
```

without having to send the entire object.

---

# Validation

## Data Annotation Validation

Used built-in validation attributes.

Examples:

```csharp
[Required]
```

```csharp
[MaxLength(100)]
```

```csharp
[EmailAddress]
```

```csharp
[Phone]
```

```csharp
[Range(...)]
```

---

## Why Use Range For IDs?

Example:

```csharp
public int OwnerId { get; set; }
```

Integers cannot be null.

If omitted:

```csharp
OwnerId = 0
```

Therefore:

```csharp
[Required]
```

does not help.

Instead:

```csharp
[Range(1, int.MaxValue)]
```

ensures a valid ID is supplied.

---

# Business Validation

Additional validation was added in controllers where business rules are enforced.

---

## Tool Creation Validation

Before creating a tool:

```text
Owner must exist
```

Validation:

```csharp
AnyAsync(...)
```

---

## Loan Creation Validation

Before creating a loan:

```text
Tool must exist
Borrower must exist
```

---

## Prevent Borrowing a Tool Already On Loan

Validation:

```csharp
tool.Status == "On Loan"
```

Returns:

```text
400 Bad Request
```

if already borrowed.

---

## Tool Status Management

When a loan is created:

```csharp
tool.Status = "On Loan";
```

When a loan is returned:

```csharp
tool.Status = "Available";
```

---

## Prevent Borrowing Own Tool

Business rule considered:

```text
Residents should not borrow tools they own.
```

---

# API Endpoints

Implemented for:

```text
Tools
Residents
Loans
```

---

## GET

Retrieve all records.

Examples:

```http
GET /api/tools
GET /api/residents
GET /api/loans
```

---

## GET BY ID

Retrieve a single record.

Examples:

```http
GET /api/tools/1
GET /api/residents/1
GET /api/loans/1
```

---

## POST

Create new records using DTOs.

Examples:

```http
POST /api/tools
POST /api/residents
POST /api/loans
```

---

## PATCH

Used PATCH rather than PUT.

### Reason

Only update supplied fields.

Example:

```json
{
    "description": "New Description"
}
```

instead of replacing the entire record.

---

## DELETE

Delete records.

Examples:

```http
DELETE /api/tools/{id}
DELETE /api/residents/{id}
DELETE /api/loans/{id}
```

---

# Loan Return Workflow

Loan PATCH endpoint was designed specifically to return a tool.

## UpdateLoanDto

Only contains:

```csharp
ReturnDate
```

### Reason

Changing:

```text
ToolId
BorrowerId
LoanDate
```

would fundamentally change the identity of the loan.

Those values should remain fixed.

---

## Return Validation Rules

### Loan Must Exist

```text
404 Not Found
```

if loan is missing.

---

### Return Date Required

```text
400 Bad Request
```

if omitted.

---

### Loan Cannot Be Returned Twice

Validation:

```csharp
loan.ReturnDate != null
```

---

### Return Date Must Occur After Loan Date

Validation:

```csharp
dto.ReturnDate > loan.LoanDate
```

---

### Tool Automatically Becomes Available

```csharp
tool.Status = "Available";
```

---

# Delete Business Rules

## Tool Deletion

Cannot delete:

```text
A tool currently on loan
```

Reason:

The active loan would reference a deleted tool.

---

## Resident Deletion

Cannot delete:

```text
A resident who still owns tools
```

Reason:

Ownership records would become invalid.

---

# Git Setup

## .gitignore

```gitignore
bin/
obj/
tools.db

.vs/
.vscode/

*.user
*.suo
```

### Why?

These files are generated automatically and should not be stored in source control.

Developers can recreate them using:

```bash
dotnet restore
dotnet ef database update
```

---

# Key Design Decisions

## Included

✅ Resident ownership of tools

✅ Loan history tracking

✅ Tool status tracking

✅ DTOs

✅ Navigation properties

✅ PATCH updates

✅ Business validation

✅ Foreign key relationships

✅ Return loan workflow

---

## Excluded

### Tool Price

Not included because:

```text
The system is designed for neighbourhood sharing,
not tool rental.
```

---

### Editing Core Loan Information

Not allowed:

```text
ToolId
BorrowerId
LoanDate
```

Reason:

Changing these values creates a different loan rather than updating an existing one.

Only ReturnDate is editable.

---

# Outcome

Completed a feature-rich ASP.NET Core backend using:

- ASP.NET Core Web API
- Entity Framework Core
- SQLite
- DTOs
- Validation
- Navigation Properties
- Foreign Keys
- CRUD Operations
- Business Rules
- Loan Return Workflow
- Tool Availability Management

The backend is now ready to be integrated with an Angular frontend.