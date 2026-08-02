// DOM elements
const questionSection = document.getElementById('question-section');
const revealSection = document.getElementById('reveal-section');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const noFeedback = document.getElementById('no-feedback');
const heartsContainer = document.getElementById('hearts-container');

// State
let isEvading = false;
let noEscapeCount = 0;
const escapePhrases = ['No', '¿Segura/o?', 'Casi...', 'Inténtalo de nuevo', 'Vamos...'];

// Detect device capabilities
const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Helper: Get random position for evading button
function getRandomPosition() {
    const padding = 20;
    const btnWidth = 120;
    const btnHeight = 48;

    const x = Math.random() * (window.innerWidth - btnWidth - padding * 2) + padding;
    const y = Math.random() * (window.innerHeight - btnHeight - padding * 2) + padding;

    return { x, y };
}

// Helper: Move button with smooth transition or instant based on user preference
function moveButton() {
    if (!isEvading) {
        isEvading = true;
        btnNo.classList.add('evading');
    }

    const pos = getRandomPosition();
    btnNo.style.left = pos.x + 'px';
    btnNo.style.top = pos.y + 'px';

    // Update escape message
    const phrase = escapePhrases[noEscapeCount % escapePhrases.length];
    noFeedback.textContent = `El botón No se movió. ${phrase}`;

    // Gentle scale animation on Yes button
    noEscapeCount++;
    if (noEscapeCount % 2 === 0) {
        btnYes.classList.add('scaled');
        setTimeout(() => btnYes.classList.remove('scaled'), 300);
    }
}

// Helper: Create floating heart animation
function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = '❤️';

    const randomX = (Math.random() - 0.5) * 150;
    heart.style.setProperty('--tx', randomX + 'px');
    heart.style.left = '50%';
    heart.style.top = '0';
    heart.style.transform = 'translateX(-50%)';

    heartsContainer.appendChild(heart);

    if (!prefersReducedMotion) {
        setTimeout(() => heart.remove(), 3000);
    } else {
        setTimeout(() => heart.remove(), 500);
    }
}

// Helper: Spawn multiple floating hearts
function spawnHearts() {
    if (!prefersReducedMotion) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => createFloatingHeart(), i * 200);
        }
    }
}

// Handle "Sí" button click
btnYes.addEventListener('click', () => {
    questionSection.classList.add('question-hidden');
    setTimeout(() => {
        questionSection.style.display = 'none';
        revealSection.classList.remove('reveal-hidden');
        revealSection.classList.add('reveal-visible');
        spawnHearts();
    }, 400);
});

// Handle "No" button - Desktop (hover)
if (supportsHover) {
    btnNo.addEventListener('mouseenter', moveButton);
    btnNo.addEventListener('pointermove', (e) => {
        // If pointer is close to button, move it
        const rect = btnNo.getBoundingClientRect();
        const distance = Math.sqrt(
            Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
            Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
        );
        if (distance < 80 && isEvading) {
            moveButton();
        }
    });
}

// Handle "No" button - Mobile/Touch
if (!supportsHover) {
    btnNo.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveButton();
    }, { passive: false });

    btnNo.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') {
            e.preventDefault();
            moveButton();
        }
    }, { passive: false });
}

// Handle "No" button - Keyboard navigation
btnNo.addEventListener('focus', () => {
    if (isEvading) {
        moveButton();
        noFeedback.textContent = 'El botón No no se puede seleccionar. ¡Presiona Sí!';
    }
});

// Prevent "No" button from being clicked (just in case)
btnNo.addEventListener('click', (e) => {
    e.preventDefault();
});

// Initialize: Trigger evasion on first interaction with "No"
btnNo.addEventListener('mouseenter', () => {
    if (!isEvading) {
        moveButton();
    }
}, { once: true });

// For mobile, trigger on first touch attempt
btnNo.addEventListener('touchstart', () => {
    if (!isEvading) {
        moveButton();
    }
}, { once: true });
