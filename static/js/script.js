
const sections = document.querySelectorAll('.fade-in-section');
window.addEventListener('scroll', () => {
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight - 100) {
            section.classList.add('visible');
        }
    });
});

window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrolled = window.scrollY;
    
    const progress = (scrolled / (documentHeight - windowHeight)) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
});