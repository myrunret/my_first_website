from analytics_module import (
    SessionAnalytics,
    RealTimeAnalytics,
    AnalyticsIntegration
)
from flask import Flask, render_template, jsonify, request, session, flash, redirect, url_for, g
from datetime import datetime
from uuid import uuid4
import json
import sqlite3
from pathlib import Path


app = Flask(__name__)
app.secret_key = 'microplastics-awareness-2026'


PLASTIC_DB_PATH = Path(__file__).parent / 'db' / 'plastic_database.db'
ANALYTICS_DB_PATH = Path(__file__).parent / 'db' / 'analytics.db'

analytics = AnalyticsIntegration()
analytics.setup_request_tracking(app, ANALYTICS_DB_PATH)

def get_db(path):
    path_str = str(path).replace('\\', '/')
    key = f"db_{path_str.replace('/', '_').replace('.', '_')}"
    if not hasattr(g, key):
        db = sqlite3.connect(path_str)
        db.row_factory = sqlite3.Row
        setattr(g, key, db)
    return getattr(g, key)


def get_tracking_session_id():
    if 'tracking_session_id' not in session:
        session['tracking_session_id'] = uuid4().hex

    session_id = session['tracking_session_id']
    try:
        db = get_db(ANALYTICS_DB_PATH)
        db.execute("""
            INSERT INTO sessions (session_id)
            VALUES (?)
            ON CONFLICT(session_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP
        """, (session_id,))
        db.commit()
    except Exception as e:
        print(f"Error tracking session: {e}")
    return session_id


def record_event(event_type, target, metadata=None, page=None):
    try:
        session_id = get_tracking_session_id()
        db = get_db(ANALYTICS_DB_PATH)
        db.execute("""
            INSERT INTO events (session_id, page, event_type, target, metadata)
            VALUES (?, ?, ?, ?, ?)
        """, (
            session_id,
            page or request.path,
            event_type,
            target,
            json.dumps(metadata or {}, sort_keys=True)
        ))
        db.commit()
    except Exception as e:
        print(f"Error recording event [{event_type}:{target}]: {e}")
        # Don't raise - analytics failure should never break the user experience
 
@app.teardown_appcontext
def close_db(error):
    for key in list(vars(g).keys()):
        if key.startswith('db_'):
            getattr(g, key).close()
            delattr(g, key)


@app.template_filter('thousands')
def thousands_filter(n):
    try:
        return f"{int(n):,}"
    except (TypeError, ValueError):
        return n

# Routes for different pages
@app.route('/')
def home():
    db = get_db(PLASTIC_DB_PATH)
    # Latest year stats 
    latest = db.execute("""
        SELECT year, annual_value, cummulative_value, source
        FROM global_production_by_year
        ORDER BY year DESC
        LIMIT 1
    """).fetchone()
    
    # Estimate total production by end of 2026 
    total_production = latest['cummulative_value'] + latest['annual_value'] * 6
 
    # Full yearly dataset 
    plastic_by_year = db.execute("""
        SELECT year, annual_value
        FROM global_production_by_year
        ORDER BY year ASC
    """).fetchall()
 
    # Convert to list of dicts 
    plastic_by_year = [
        {"year": row["year"], "value": row["annual_value"]}
        for row in plastic_by_year
    ]
 
    return render_template(
        'index.html',
        latest=latest,
        total=total_production,
        plastic_by_year=plastic_by_year
    )

@app.route('/sources')
def sources():
    return render_template('sources.html')

@app.route('/tech')
def tech():
    return render_template('tech.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/action')
def action():
    db = get_db(ANALYTICS_DB_PATH)
    pledges_count = db.execute('SELECT COUNT(*) FROM pledges').fetchone()[0]
    return render_template(
        'action.html',
        pledges=pledges_count)

# Handling pledge submissions
@app.route('/submit-pledge', methods=['POST'])
def submit_pledge():
    data = request.get_json(silent=True) or request.form
    name = (data.get('name') or '').strip()

    if not name:
        return jsonify({'status': 'error', 'message': 'Name is required.'}), 400

    session_id = get_tracking_session_id()
    db = get_db(ANALYTICS_DB_PATH)
    db.execute("""
        INSERT INTO pledges (session_id, name)
        VALUES (?, ?)
    """, (session_id, name[:40]))
    db.commit()
    record_event('pledge_submit', 'pledge')

    pledges_count = db.execute('SELECT COUNT(*) FROM pledges').fetchone()[0]
    return jsonify({'status': 'saved', 'pledges': pledges_count})

# Handling contact form submission
@app.route('/submit-contact', methods=['POST'])
def submitContact():
    session_id = get_tracking_session_id()
    submission = {
        'name': (request.form.get('name') or '').strip(),
        'email': (request.form.get('email') or '').strip(),
        'message': (request.form.get('message') or '').strip()
    }

    if not all(submission.values()):
        flash('Please complete every field before sending your message.', 'error')
        return redirect(url_for('contact'))

    db = get_db(ANALYTICS_DB_PATH)      
    db.execute("""
        INSERT INTO contact_submissions (session_id, name, email, message)
        VALUES (?, ?, ?, ?)
    """, (session_id, submission['name'], submission['email'], submission['message'])) 
    db.commit()
    record_event('contact_submit', 'contact_form')

    flash('Thank you for your message! We will get back to you soon.', 'success')
    return redirect(url_for('contact'))

# User tracking for engagement analytics
@app.route('/track-section', methods=['POST'])
def track_section():
    data = request.get_json(silent=True) or {}
    event_type = (data.get('event_type') or 'section_view')[:80]
    target = (data.get('target') or data.get('section') or 'unknown')[:120]
    page = (data.get('page') or request.referrer or request.path)[:240]
    metadata = data.get('metadata') if isinstance(data.get('metadata'), dict) else {}

    record_event(event_type, target, metadata=metadata, page=page)

    viewed = session.setdefault('sections_viewed', [])
    if event_type == 'section_view' and target not in viewed:
        viewed.append(target)
        session['sections_viewed'] = viewed

    completion = round((len(viewed) / 5) * 100)

    return jsonify({
        'status': 'tracked',
        'completion': completion
    })

@app.route('/analytics/dashboard')
def analytics_dashboard():
    
    db = get_db(ANALYTICS_DB_PATH)
    from analytics_module import RealTimeAnalytics
    
    summary = RealTimeAnalytics.get_summary(db)
    today = RealTimeAnalytics.get_today_summary(db)
    
    return jsonify({
        'realtime': summary,
        'today': today
    })

@app.route('/analytics/session/<session_id>')
def session_analytics(session_id):
    db = get_db(ANALYTICS_DB_PATH)
    from analytics_module import SessionAnalytics
    
    summary = SessionAnalytics.get_session_summary(db, session_id)
    return jsonify(summary) if summary else jsonify({'error': 'Session not found'}), 404

# Run the app
if __name__ == '__main__':
    app.run(debug=True)
