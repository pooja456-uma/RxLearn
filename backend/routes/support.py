from fastapi import APIRouter, HTTPException
from database import get_db_connection
from models import TicketRequest
import traceback

router = APIRouter()

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