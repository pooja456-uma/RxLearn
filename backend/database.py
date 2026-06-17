import mysql.connector
from mysql.connector import Error

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="Root", 
            database="rxlearn_db"
        )
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"CRITICAL: MySQL Connection Failed -> {e}")
        return None