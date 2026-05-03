from flask import Flask, render_template, jsonify, request, session, flash, redirect, url_for, g
from datetime import datetime
import json
import sqlite3

app = Flask(__name__)
app.secret_key = 'microplastics-awareness-2026'

DB_PATH = 'db/plastic_database.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db
 
@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.template_filter('thousands')
def thousands_filter(n):
    try:
        return f"{int(n):,}"
    except (TypeError, ValueError):
        return n

# Routes for different pages
@app.route('/')
def home():
    db = get_db()
    # Latest year stats (your existing cards)
    latest = db.execute("""
        SELECT year, annual_value AS annual_value, source
        FROM global_production_by_year
        ORDER BY year DESC
        LIMIT 1
    """).fetchone()
 
    # Growth multiplier since earliest year
    earliest = db.execute("""
        SELECT annual_value
        FROM global_production_by_year
        ORDER BY year ASC
        LIMIT 1
    """).fetchone()
 
    growth = round(latest['annual_value'] / earliest['annual_value'])
 
    # Full yearly dataset for the scroll timeline
    plastic_by_year = db.execute("""
        SELECT year, annual_value
        FROM global_production_by_year
        ORDER BY year ASC
    """).fetchall()
 
    # Convert to list of dicts for tojson filter
    plastic_by_year = [
        {"year": row["year"], "value": row["annual_value"]}
        for row in plastic_by_year
    ]
 
    return render_template(
        'index.html',
        latest=latest,
        growth=growth,
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
    """Practical reduction tips and the pledge form (template: action.html)."""
    return render_template('action.html')

# Handling contact form submission
@app.route('/submit-contact', methods=['POST'])
def submitContact():
    submission = {
        'name': request.form.get('name'),
        'email': request.form.get('email'),
        'message': request.form.get('message'),
        'timestamp': datetime.now().isoformat()
    }
    with open('contact_submissions.json', 'a') as f:
        json.dump(submission, f)
        f.write('\n')
    flash('Thank you for your message! We will get back to you soon.', 'success')

    return redirect(url_for('contact'))

# User tracking for engagement analytics
@app.route('/track-section', methods=['POST'])
def track_section():
    data = request.json
    section = data.get('section')
    
    if 'sections_viewed' not in session:
        session['sections_viewed'] = []
    
    if section not in session['sections_viewed']:
        session['sections_viewed'].append(section)
    
    # Track how far users scroll
    completion = len(session['sections_viewed']) / 5 * 100
    
    return jsonify({
        'status': 'tracked',
        'completion': completion
    })
# Run the app
if __name__ == '__main__':
    app.run(debug=True)
