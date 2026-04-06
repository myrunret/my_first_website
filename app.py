from flask import Flask, render_template, jsonify, request, session, flash, redirect
from datetime import datetime
import json

app = Flask(__name__)
app.secret_key = 'microplastics-awareness-2026'

contact_submissions = []

# Routes for different pages
@app.route('/')
def home():
    return render_template('index.html')

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
    contact_submissions.append(submission)
    with open('contact_submissions.json', 'a') as f:
        json.dump(submission, f)
        f.write('\n')
    flash('Thank you for your message! We will get back to you soon.', 'success')
    redirect('/contact')
    return render_template('contact.html')

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
