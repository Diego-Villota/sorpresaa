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

// Last known pointer position, so the button never lands under the cursor
const pointer = { x: -9999, y: -9999 };

// Helper: does rect (x, y, w, h) overlap the question card (plus a safety gap)?
function overlapsCard(x, y, w, h) {
    const card = questionSection.getBoundingClientRect();
    const gap = 24;
    return (
        x < card.right + gap &&
        x + w > card.left - gap &&
        y < card.bottom + gap &&
        y + h > card.top - gap
    );
}

// Helper: pick a random on-screen spot away from the card and from the cursor
function getSafePosition() {
    const margin = 12;
    const rect = btnNo.getBoundingClientRect();
    const w = rect.width || 110;
    const h = rect.height || 48;

    const maxX = Math.max(margin, window.innerWidth - w - margin);
    const maxY = Math.max(margin, window.innerHeight - h - margin);

    for (let i = 0; i < 40; i++) {
        const x = margin + Math.random() * (maxX - margin);
        const y = margin + Math.random() * (maxY - margin);

        const nearCursor =
            Math.abs(x + w / 2 - pointer.x) < w + 40 &&
            Math.abs(y + h / 2 - pointer.y) < h + 40;

        if (!overlapsCard(x, y, w, h) && !nearCursor) {
            return { x, y };
        }
    }

    // Fallback (tiny viewport): the corner farthest from the cursor
    const corners = [
        { x: margin, y: margin },
        { x: maxX, y: margin },
        { x: margin, y: maxY },
        { x: maxX, y: maxY }
    ];
    return corners.reduce((best, c) => {
        const d = Math.hypot(c.x - pointer.x, c.y - pointer.y);
        return d > best.d ? { ...c, d } : best;
    }, { ...corners[0], d: -1 });
}

// Helper: move the button to a new spot — it slides, it never disappears
function moveButton() {
    if (!isEvading) {
        isEvading = true;
        // Reparent to <body>: the card clips fixed children (overflow:hidden +
        // the perspective/backdrop-filter containing block), which made the
        // button vanish instead of relocating.
        document.body.appendChild(btnNo);
        btnNo.classList.add('evading');
    }

    const pos = getSafePosition();
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

// Keep the button on screen when the viewport changes
function clampToViewport() {
    if (!isEvading) return;
    const margin = 12;
    const rect = btnNo.getBoundingClientRect();
    const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
    btnNo.style.left = Math.min(Math.max(rect.left, margin), maxX) + 'px';
    btnNo.style.top = Math.min(Math.max(rect.top, margin), maxY) + 'px';
}

// Helper: Create one heart rising up the screen
function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = '❤️';

    // Spread across the width, drift sideways, vary size and pace
    heart.style.left = (5 + Math.random() * 90) + '%';
    heart.style.setProperty('--tx', ((Math.random() - 0.5) * 160) + 'px');
    heart.style.fontSize = (1.4 + Math.random() * 1.4) + 'rem';
    heart.style.animationDuration = (3.4 + Math.random() * 1.8) + 's';

    heartsContainer.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
    // Safety net: if the animation never runs (or never ends), don't leak nodes
    setTimeout(() => heart.remove(), 7000);
}

// Helper: Spawn a stream of hearts
function spawnHearts() {
    if (prefersReducedMotion) return;
    for (let i = 0; i < 16; i++) {
        setTimeout(createFloatingHeart, i * 180);
    }
}

// Handle "Sí" button click
btnYes.addEventListener('click', () => {
    questionSection.classList.add('question-hidden');
    setTimeout(() => {
        questionSection.style.display = 'none';
        btnNo.remove(); // it lives on <body> once it starts evading
        revealSection.classList.remove('reveal-hidden');
        revealSection.classList.add('reveal-visible');
        spawnHearts();
    }, 400);
});

// Track the cursor so the button never relocates right under it
window.addEventListener('mousemove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
}, { passive: true });

window.addEventListener('resize', clampToViewport);

// Handle "No" button - it escapes on every attempt, whatever the input
if (supportsHover) {
    btnNo.addEventListener('mouseenter', moveButton);
    btnNo.addEventListener('mouseover', moveButton);
    btnNo.addEventListener('mousedown', (e) => {
        e.preventDefault();
        moveButton();
    });
} else {
    btnNo.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveButton();
    }, { passive: false });
}

// Never let the click land
btnNo.addEventListener('click', (e) => {
    e.preventDefault();
    moveButton();
});

// Keyboard navigation
btnNo.addEventListener('focus', () => {
    moveButton();
    noFeedback.textContent = 'El botón No no se puede seleccionar. ¡Presiona Sí!';
});
