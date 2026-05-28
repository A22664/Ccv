/* ============================================
   ROYAL CHESS 3D — Animation Engine
   Smooth piece movements, camera effects,
   combat animations, visual feedback
   Optimized with CSS transforms & requestAnimationFrame
   ============================================ */

// ============================================
// ANIMATION CONFIGURATION
// ============================================
const ANIMATION = {
    pieceMoveDuration: 400,      // ms
    captureDuration: 500,        // ms
    cameraShakeIntensity: 3,     // pixels
    cameraShakeDuration: 300,    // ms
    glowIntensity: 0.8,
    trailLength: 5
};

// ============================================
// PIECE MOVEMENT ANIMATION
// ============================================

function animatePieceMove(fromRow, fromCol, toRow, toCol, callback) {
    const board = document.getElementById('chess-board');
    if (!board) {
        if (callback) callback();
        return;
    }

    const squareSize = board.offsetWidth / 8;
    const fromIndex = fromRow * 8 + fromCol;
    const toIndex = toRow * 8 + toCol;

    const fromSquare = board.children[fromIndex];
    const pieceEl = fromSquare.querySelector('.piece');

    if (!pieceEl) {
        if (callback) callback();
        return;
    }

    // Calculate positions
    const fromX = fromCol * squareSize;
    const fromY = fromRow * squareSize;
    const toX = toCol * squareSize;
    const toY = toRow * squareSize;

    // Create animated clone
    const clone = pieceEl.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = `${fromX}px`;
    clone.style.top = `${fromY}px`;
    clone.style.width = `${squareSize}px`;
    clone.style.height = `${squareSize}px`;
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none';
    clone.style.transition = 'none';
    clone.classList.add('moving-piece');

    // Hide original temporarily
    pieceEl.style.opacity = '0';

    board.appendChild(clone);

    // Trigger animation
    requestAnimationFrame(() => {
        clone.style.transition = `transform ${ANIMATION.pieceMoveDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), filter ${ANIMATION.pieceMoveDuration}ms`;
        clone.style.transform = `translate(${toX - fromX}px, ${toY - fromY}px)`;
        clone.style.filter = 'drop-shadow(0 15px 20px rgba(0,0,0,0.6)) brightness(1.2)';
    });

    // Trail effect
    createMoveTrail(fromX, fromY, toX, toY, squareSize);

    // Cleanup
    setTimeout(() => {
        if (clone.parentNode) clone.parentNode.removeChild(clone);
        if (pieceEl) pieceEl.style.opacity = '1';
        if (callback) callback();
    }, ANIMATION.pieceMoveDuration);
}

function createMoveTrail(fromX, fromY, toX, toY, squareSize) {
    const board = document.getElementById('chess-board');
    if (!board) return;

    const steps = ANIMATION.trailLength;
    const dx = (toX - fromX) / steps;
    const dy = (toY - fromY) / steps;

    for (let i = 1; i < steps; i++) {
        setTimeout(() => {
            const trail = document.createElement('div');
            trail.style.cssText = `
                position: absolute;
                left: ${fromX + dx * i + squareSize / 2 - 3}px;
                top: ${fromY + dy * i + squareSize / 2 - 3}px;
                width: 6px;
                height: 6px;
                background: radial-gradient(circle, rgba(212,175,55,0.4), transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 999;
                animation: trailFade 300ms ease-out forwards;
            `;
            board.appendChild(trail);

            setTimeout(() => {
                if (trail.parentNode) trail.parentNode.removeChild(trail);
            }, 300);
        }, i * 30);
    }
}

// Add trail animation keyframes dynamically
const trailStyle = document.createElement('style');
trailStyle.textContent = `
    @keyframes trailFade {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2); opacity: 0; }
    }
`;
document.head.appendChild(trailStyle);

// ============================================
// CAPTURE ANIMATION
// ============================================

function animateCapture(row, col, pieceType, color) {
    const board = document.getElementById('chess-board');
    if (!board) return;

    const squareSize = board.offsetWidth / 8;
    const x = col * squareSize + squareSize / 2;
    const y = row * squareSize + squareSize / 2;

    // Combat flash
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute;
        left: ${x - squareSize / 2}px;
        top: ${y - squareSize / 2}px;
        width: ${squareSize}px;
        height: ${squareSize}px;
        background: radial-gradient(circle, rgba(212,175,55,0.6), transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 998;
        animation: captureFlash 400ms ease-out forwards;
    `;
    board.appendChild(flash);

    setTimeout(() => {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 400);

    // Particle burst
    createParticleBurst(x, y, color);

    // Camera shake
    shakeCamera();

    // Sound is handled by audio.js
}

function createParticleBurst(x, y, color) {
    const board = document.getElementById('chess-board');
    if (!board) return;

    const particleCount = 12;
    const colors = color === 'white' 
        ? ['#f5f5f0', '#e8d5b7', '#d4af37'] 
        : ['#1a1a1a', '#333', '#666'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const angle = (Math.PI * 2 * i) / particleCount;
        const distance = 30 + Math.random() * 40;
        const size = 3 + Math.random() * 5;
        const particleColor = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${particleColor};
            border-radius: 50%;
            pointer-events: none;
            z-index: 997;
            box-shadow: 0 0 6px ${particleColor};
        `;

        board.appendChild(particle);

        // Animate particle
        const destX = Math.cos(angle) * distance;
        const destY = Math.sin(angle) * distance;

        requestAnimationFrame(() => {
            particle.style.transition = 'all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            particle.style.transform = `translate(${destX}px, ${destY}px)`;
            particle.style.opacity = '0';
        });

        setTimeout(() => {
            if (particle.parentNode) particle.parentNode.removeChild(particle);
        }, 500);
    }
}

// ============================================
// CAMERA SHAKE EFFECT
// ============================================

function shakeCamera() {
    const boardWrapper = document.getElementById('board-wrapper');
    if (!boardWrapper) return;

    const intensity = ANIMATION.cameraShakeIntensity;
    const duration = ANIMATION.cameraShakeDuration;
    const startTime = Date.now();

    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
            boardWrapper.style.transform = '';
            return;
        }

        const progress = elapsed / duration;
        const dampening = 1 - progress;
        const x = (Math.random() - 0.5) * intensity * 2 * dampening;
        const y = (Math.random() - 0.5) * intensity * 2 * dampening;

        boardWrapper.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(shake);
    }

    shake();
}

// ============================================
// PIECE SELECTION GLOW
// ============================================

function animateSelection(row, col) {
    const board = document.getElementById('chess-board');
    if (!board) return;

    const index = row * 8 + col;
    const square = board.children[index];
    if (!square) return;

    const piece = square.querySelector('.piece');
    if (!piece) return;

    // Add selection glow
    piece.style.animation = 'selectGlow 1.5s ease-in-out infinite';

    // Remove glow after deselection
    setTimeout(() => {
        piece.style.animation = '';
    }, 2000);
}

// Add selection glow keyframes
const selectStyle = document.createElement('style');
selectStyle.textContent = `
    @keyframes selectGlow {
        0%, 100% { filter: drop-shadow(0 0 8px rgba(212,175,55,0.6)); }
        50% { filter: drop-shadow(0 0 20px rgba(212,175,55,0.9)) brightness(1.2); }
    }

    @keyframes captureFlash {
        0% { transform: scale(0.5); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.8; }
        100% { transform: scale(2); opacity: 0; }
    }
`;
document.head.appendChild(selectStyle);

// ============================================
// CHECK WARNING ANIMATION
// ============================================

function animateCheckWarning() {
    const board = document.getElementById('chess-board');
    if (!board) return;

    // Red flash overlay
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle, rgba(196,30,58,0.15), transparent 70%);
        pointer-events: none;
        z-index: 100;
        animation: checkFlash 800ms ease-out forwards;
    `;
    document.body.appendChild(flash);

    setTimeout(() => {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 800);
}

const checkStyle = document.createElement('style');
checkStyle.textContent = `
    @keyframes checkFlash {
        0% { opacity: 0; }
        20% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(checkStyle);

// ============================================
// CASTLE ANIMATION
// ============================================

function animateCastling(kingRow, kingFromCol, kingToCol, rookFromCol, rookToCol) {
    const board = document.getElementById('chess-board');
    if (!board) return;

    const squareSize = board.offsetWidth / 8;

    // Animate king
    const kingIndex = kingRow * 8 + kingFromCol;
    const kingSquare = board.children[kingIndex];
    const kingPiece = kingSquare.querySelector('.piece');

    // Animate rook
    const rookIndex = kingRow * 8 + rookFromCol;
    const rookSquare = board.children[rookIndex];
    const rookPiece = rookSquare.querySelector('.piece');

    if (kingPiece) {
        kingPiece.style.transition = `transform ${ANIMATION.pieceMoveDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        kingPiece.style.transform = `translateX(${(kingToCol - kingFromCol) * squareSize}px)`;
    }

    if (rookPiece) {
        setTimeout(() => {
            rookPiece.style.transition = `transform ${ANIMATION.pieceMoveDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            rookPiece.style.transform = `translateX(${(rookToCol - rookFromCol) * squareSize}px)`;
        }, 100);
    }

    // Reset transforms after animation
    setTimeout(() => {
        if (kingPiece) kingPiece.style.transform = '';
        if (rookPiece) rookPiece.style.transform = '';
    }, ANIMATION.pieceMoveDuration + 200);
}

// ============================================
// PROMOTION ANIMATION
// ============================================

function animatePromotion(row, col, newPieceType, color) {
    const board = document.getElementById('chess-board');
    if (!board) return;

    const index = row * 8 + col;
    const square = board.children[index];

    // Create glow effect
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: absolute;
        left: 0; top: 0; right: 0; bottom: 0;
        background: radial-gradient(circle, rgba(212,175,55,0.5), transparent);
        animation: promotionGlow 600ms ease-out forwards;
        pointer-events: none;
        z-index: 50;
    `;
    square.appendChild(glow);

    setTimeout(() => {
        if (glow.parentNode) glow.parentNode.removeChild(glow);
    }, 600);

    // Animate new piece appearing
    const pieceEl = square.querySelector('.piece');
    if (pieceEl) {
        pieceEl.style.transform = 'scale(0)';
        pieceEl.style.transition = 'transform 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        requestAnimationFrame(() => {
            pieceEl.style.transform = 'scale(1)';
        });
    }
}

const promoStyle = document.createElement('style');
promoStyle.textContent = `
    @keyframes promotionGlow {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0; transform: scale(1.5); }
    }
`;
document.head.appendChild(promoStyle);

// ============================================
// BOARD PERSPECTIVE ANIMATION
// ============================================

function animateBoardEntrance() {
    const boardWrapper = document.querySelector('.board-perspective');
    if (!boardWrapper) return;

    boardWrapper.style.opacity = '0';
    boardWrapper.style.transform = 'rotateX(45deg) translateY(100px)';

    requestAnimationFrame(() => {
        boardWrapper.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        boardWrapper.style.opacity = '1';
        boardWrapper.style.transform = 'rotateX(25deg)';
    });
}

// ============================================
// AI THINKING INDICATOR
// ============================================

function showThinkingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'ai-thinking-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(18, 18, 26, 0.95);
        border: 1px solid rgba(212,175,55,0.3);
        border-radius: 30px;
        padding: 12px 30px;
        color: var(--primary-gold);
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        letter-spacing: 0.1em;
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;

    indicator.innerHTML = `
        <span class="thinking-dots">
            <span></span><span></span><span></span>
        </span>
        <span>AI Calculating</span>
    `;

    document.body.appendChild(indicator);

    // Add thinking dots animation
    const dotsStyle = document.createElement('style');
    dotsStyle.textContent = `
        .thinking-dots { display: flex; gap: 4px; }
        .thinking-dots span {
            width: 6px; height: 6px;
            background: var(--primary-gold);
            border-radius: 50%;
            animation: thinkingDot 1.4s ease-in-out infinite;
        }
        .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes thinkingDot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(dotsStyle);
}

function hideThinkingIndicator() {
    const indicator = document.getElementById('ai-thinking-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
        }, 300);
    }
}

// ============================================
// VICTORY ANIMATION
// ============================================

function animateVictory() {
    // Create confetti-like particles
    const colors = ['#d4af37', '#f0d878', '#ffd700', '#fff', '#c41e3a'];

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createVictoryParticle(colors);
        }, i * 50);
    }
}

function createVictoryParticle(colors) {
    const particle = document.createElement('div');
    const startX = Math.random() * window.innerWidth;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 8;

    particle.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: -20px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events: none;
        z-index: 3000;
        box-shadow: 0 0 10px ${color};
    `;

    document.body.appendChild(particle);

    const duration = 2000 + Math.random() * 2000;
    const destX = startX + (Math.random() - 0.5) * 300;

    requestAnimationFrame(() => {
        particle.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        particle.style.transform = `translate(${destX - startX}px, ${window.innerHeight + 50}px) rotate(${Math.random() * 720}deg)`;
        particle.style.opacity = '0';
    });

    setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, duration);
}

// ============================================
// EXPORT
// ============================================
window.animatePieceMove = animatePieceMove;
window.animateCapture = animateCapture;
window.animateCheckWarning = animateCheckWarning;
window.animateCastling = animateCastling;
window.animatePromotion = animatePromotion;
window.animateBoardEntrance = animateBoardEntrance;
window.showThinkingIndicator = showThinkingIndicator;
window.hideThinkingIndicator = hideThinkingIndicator;
window.animateVictory = animateVictory;
window.ANIMATION = ANIMATION;
