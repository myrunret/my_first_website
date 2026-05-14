from flask import g, request, session
from datetime import datetime
import time
import json
import sqlite3

class SessionAnalytics:
    """Analyze individual session behavior"""

    @staticmethod
    def get_session_summary(db, session_id):
        """Get complete session analytics"""
        
        # Basic session data
        session_data = db.execute("""
            SELECT 
                session_id,
                first_seen,
                last_seen,
                CAST((julianday(last_seen) - julianday(first_seen)) * 86400 AS INTEGER) as duration_seconds
            FROM sessions
            WHERE session_id = ?
        """, (session_id,)).fetchone()
        
        if not session_data:
            return None
        
        # Pages visited
        pages = db.execute("""
            SELECT url, COUNT(*) as visits, ROUND(AVG(duration_ms), 0) as avg_duration_ms
            FROM page_views
            WHERE session_id = ?
            GROUP BY url
            ORDER BY visits DESC
        """, (session_id,)).fetchall()
        
        
        return {
            'session_id': session_id,
            'first_seen': session_data['first_seen'],
            'last_seen': session_data['last_seen'],
            'duration_seconds': session_data['duration_seconds'],
            'pages': [dict(p) for p in pages],
            'pages_visited': len(pages)
            }

class RealTimeAnalytics:
    """Get real-time analytics snapshots"""
    
    @staticmethod
    def get_summary(db):
        """Real-time analytics snapshot"""
        
        return {
            'active_sessions': db.execute("""
                SELECT COUNT(*) FROM sessions 
                WHERE last_seen > datetime('now', '-15 minutes')
            """).fetchone()[0],
            
            'total_sessions': db.execute("""
                SELECT COUNT(*) FROM sessions
            """).fetchone()[0],
            
            'pledges': db.execute("""
                SELECT COUNT(*) FROM pledges
            """).fetchone()[0],
            
            'contacts': db.execute("""
                SELECT COUNT(*) FROM contact_submissions
            """).fetchone()[0],
            
            'avg_session_duration': db.execute("""
                SELECT ROUND(AVG(CAST((julianday(last_seen) - julianday(first_seen)) * 86400 AS INTEGER)), 0)
                FROM sessions
            """).fetchone()[0] or 0,
            
            'top_pages': [dict(p) for p in db.execute("""
                SELECT url, COUNT(*) as visits, ROUND(AVG(duration_ms), 0) as avg_duration
                FROM page_views
                GROUP BY url
                ORDER BY visits DESC
                LIMIT 5
            """).fetchall()],
            
        }
    
    @staticmethod
    def get_today_summary(db):
        """Analytics for today only"""
        
        return {
            'sessions_today': db.execute("""
                SELECT COUNT(*) FROM sessions 
                WHERE DATE(first_seen) = DATE('now')
            """).fetchone()[0],
            
            'page_views_today': db.execute("""
                SELECT COUNT(*) FROM page_views 
                WHERE DATE(timestamp) = DATE('now')
            """).fetchone()[0],
            
            'pledges_today': db.execute("""
                SELECT COUNT(*) FROM pledges 
                WHERE DATE(submitted_at) = DATE('now')
            """).fetchone()[0],
            
            'contacts_today': db.execute("""
                SELECT COUNT(*) FROM contact_submissions 
                WHERE DATE(submitted_at) = DATE('now')
            """).fetchone()[0],
        }

class AnalyticsIntegration:
    
    @staticmethod
    def setup_request_tracking(app, db_path):
        
        
        @app.before_request
        def before_request():
            """Track request start"""
            g.request_start_time = time.time()
        
        @app.after_request
        def after_request(response):
            """Track request completion"""
            if request.endpoint == 'static':
                return response
            
            # Only track if session has been initialized
            if 'tracking_session_id' not in session:
                return response
            
            try:
                db = sqlite3.connect(db_path)
                db.row_factory = sqlite3.Row
                
                duration = time.time() - g.get('request_start_time', time.time())
                
                db.execute("""
                    INSERT INTO page_views 
                    (session_id, url, status_code, duration_ms )
                    VALUES (?, ?, ?, ?)
                """, (
                    session['tracking_session_id'],
                    request.path,
                    response.status_code,
                    int(duration * 1000),
                ))
                db.commit()
                db.close()
            except Exception as e:
                print(f"Error tracking page view: {e}")
            
            return response

