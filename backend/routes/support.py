from fastapi import APIRouter, HTTPException
from database import get_db_connection
from models import TicketRequest
import traceback

router = APIRouter()

# ==========================================
# EXISTING METHOD (PRESERVED UNCHANGED)
# ==========================================
@router.post("/api/support/ticket")
async def submit_support_ticket(ticket: TicketRequest):
    # This will print in your terminal so you can see if data arrived
    print(f"Received Ticket Request: {ticket}")
    
    conn = get_db_connection()
    if not conn: 
        raise HTTPException(status_code=503, detail="Database offline")
    
    cursor = conn.cursor()
    try:
        # Check these column names against your MySQL table one by one
        query = """
            INSERT INTO support_tickets 
            (registration_number, student_name, student_email, issue_description) 
            VALUES (%s, %s, %s, %s)
        """
        
        values = (
            ticket.registration_number, 
            ticket.name, 
            ticket.email, 
            ticket.message
        )
        
        cursor.execute(query, values)
        conn.commit() 
        print("✅ Database updated successfully!")
        return {"status": "success"}

    except Exception as e:
        # THIS IS KEY: It will print the real error in your VS Code terminal
        print("--- DATABASE ERROR LOG ---")
        print(traceback.format_exc()) 
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()


# ==========================================
# NEW ADMIN MANAGEMENT ENDPOINTS APPENDED
# ==========================================

@router.get("/api/admin/tickets")
def get_all_tickets():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")
        
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM support_tickets ORDER BY created_at DESC")
        tickets = cursor.fetchall()
        return tickets
    except Exception as e:
        print("--- ADMIN TICKETS FETCH ERROR ---")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.put("/api/admin/tickets/{ticket_id}")
def update_ticket_status(ticket_id: int, status_update: dict):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database offline")
        
    cursor = conn.cursor()
    try:
        new_status = status_update.get("status", "Resolved")
        cursor.execute(
            "UPDATE support_tickets SET status = %s WHERE ticket_id = %s",
            (new_status, ticket_id)
        )
        conn.commit()
        print(f"✅ Ticket ID {ticket_id} status updated to: {new_status}")
        return {"status": "success", "message": "Ticket status updated successfully"}
    except Exception as e:
        print("--- ADMIN TICKET UPDATE ERROR ---")
        print(traceback.format_exc())
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()