# Community Sharing System

- Residents can **offer** tools
- Residents can **borrow** tools.

The system needs to know:
- what tools exist
- what's available
- what's on loan
- who currently has a tool

# Data model Draft
## Resident table

| Id (primarykey) | Name | Email | PhoneNumber |

## Tool table

| Id (primarykey) | Name | Description | Weight | Status | OwnerId (foreignkey) |

## Loan table

| Id | ToolId (foreignkey) | BorrowerId (foreignkey) | LoanDate | ReturnDate |

### ER diagram

![alt text](image.png)

- Resident (1) ---- (*) Tool
- Resident (1) ---- (*) Loan
- Tool (1) ---- (*) Loan

>maybe add category

# User Stories

1) **As a** resident **I want** to add a tool that I am willing to lend so that other residents can borrow it.
2) **As a** resident, **I want** to view all available tools so that I can find something to borrow.
3) **As a** resident, **I want** to mark a tool as on loan or available so that the system shows its current availability.
4) **As a** resident, **I want** to remove a tool from the library so that it is no longer available for borrowing.