/* ============================================
   ROYAL CHESS 3D — Game Engine
   Complete Chess Logic, Board Management,
   Move Validation, Game State, UI Controller
   ============================================ */

// ============================================
// GLOBAL GAME STATE
// ============================================
const GameState = {
    board: [],           // 8x8 board array
    currentPlayer: 'white',
    selectedPiece: null,
    validMoves: [],
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    gameMode: 'pvp',     // 'pvp' or 'ai'
    difficulty: 'medium', // 'easy', 'medium', 'hard'
    gameOver: false,
    inCheck: false,
    enPassantTarget: null,
    castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true
    },
    halfMoveClock: 0,
    fullMoveNumber: 1,
    soundEnabled: true,
    animSpeed: 3,
    showHints: true,
    aiThinking: false,
    lastMove: null,
    promotionPending: null
};

// Unicode chess pieces
const PIECES = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

// Piece values for scoring
const PIECE_VALUES = {
    pawn: 100, knight: 320, bishop: 330,
    rook: 500, queen: 900, king: 20000
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    createParticles();
    startTimer();
});

function createParticles() {
    const container = document.querySelector('.menu-particles');
    if (!container) return;
    // Particles are handled via CSS pseudo-elements for performance
}

// ============================================
// SCREEN NAVIGATION
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'flex';
        // Small delay for transition
        requestAnimationFrame(() => {
            screen.classList.add('active');
        });
    }
}

function showMainMenu() {
    showScreen('main-menu');
    playSound('click');
}

function showModeSelect() {
    showScreen('mode-select');
    playSound('click');
}

function showDifficultySelect() {
    showScreen('difficulty-select');
    playSound('click');
}

function showSettings() {
    showScreen('settings-screen');
    playSound('click');
}

function showCredits() {
    showScreen('credits-screen');
    playSound('click');
}

function returnToMenu() {
    if (confirm('Return to main menu? Current game will be lost.')) {
        showMainMenu();
        playSound('click');
    }
}

// ============================================
// GAME START
// ============================================

function startGame(mode, difficulty = 'medium') {
    GameState.gameMode = mode;
    GameState.difficulty = difficulty;
    GameState.gameOver = false;
    GameState.aiThinking = false;
    GameState.moveHistory = [];
    GameState.capturedPieces = { white: [], black: [] };
    GameState.currentPlayer = 'white';
    GameState.halfMoveClock = 0;
    GameState.fullMoveNumber = 1;
    GameState.enPassantTarget = null;
    GameState.castlingRights = {
        whiteKingSide: true, whiteQueenSide: true,
        blackKingSide: true, blackQueenSide: true
    };
    GameState.lastMove = null;
    GameState.promotionPending = null;

    initializeBoard();
    renderBoard();
    updateHUD();
    clearMoveHistory();

    showScreen('game-screen');
    playSound('gameStart');

    // AI plays first if black (not implemented, white always first)
}

function restartGame() {
    document.getElementById('gameover-modal').classList.remove('active');
    startGame(GameState.gameMode, GameState.difficulty);
}

// ============================================
// BOARD INITIALIZATION
// ============================================

function initializeBoard() {
    // Standard chess starting position
    const setup = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    GameState.board = setup.map((row, r) => 
        row.map((piece, c) => piece ? createPiece(piece, r, c) : null)
    );
}

function createPiece(char, row, col) {
    const isWhite = char === char.toUpperCase();
    const type = getPieceType(char.toLowerCase());
    return {
        type: type,
        color: isWhite ? 'white' : 'black',
        row: row,
        col: col,
        hasMoved: false,
        id: `${type}_${isWhite ? 'w' : 'b'}_${row}_${col}_${Date.now()}_${Math.random()}`
    };
}

function getPieceType(char) {
    const map = { 'p': 'pawn', 'r': 'rook', 'n': 'knight', 
                  'b': 'bishop', 'q': 'queen', 'k': 'king' };
    return map[char] || 'pawn';
}

function getPieceChar(piece) {
    const map = { pawn: 'p', rook: 'r', knight: 'n', 
                  bishop: 'b', queen: 'q', king: 'k' };
    let ch = map[piece.type];
    return piece.color === 'white' ? ch.toUpperCase() : ch;
}

// ============================================
// BOARD RENDERING
// ============================================

function renderBoard() {
    const boardEl = document.getElementById('chess-board');
    if (!boardEl) return;

    boardEl.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;

            // Add last move highlight
            if (GameState.lastMove) {
                if ((row === GameState.lastMove.fromRow && col === GameState.lastMove.fromCol) ||
                    (row === GameState.lastMove.toRow && col === GameState.lastMove.toCol)) {
                    square.classList.add('last-move');
                }
            }

            // Add check highlight
            const piece = GameState.board[row][col];
            if (piece && piece.type === 'king' && piece.color === GameState.currentPlayer && GameState.inCheck) {
                square.classList.add('check');
            }

            // Add selected highlight
            if (GameState.selectedPiece && 
                GameState.selectedPiece.row === row && 
                GameState.selectedPiece.col === col) {
                square.classList.add('selected');
            }

            // Add valid move indicators
            if (GameState.selectedPiece && GameState.showHints) {
                const isValid = GameState.validMoves.some(m => m.row === row && m.col === col);
                if (isValid) {
                    square.classList.add('valid-move');
                    if (piece && piece.color !== GameState.selectedPiece.color) {
                        square.classList.add('capture');
                    }
                }
            }

            // Render piece
            if (piece) {
                const pieceEl = document.createElement('span');
                pieceEl.className = `piece ${piece.color}`;
                pieceEl.textContent = PIECES[piece.color][piece.type];
                pieceEl.dataset.pieceId = piece.id;
                square.appendChild(pieceEl);
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardEl.appendChild(square);
        }
    }
}

// ============================================
// CLICK HANDLER
// ============================================

function handleSquareClick(row, col) {
    if (GameState.gameOver || GameState.aiThinking || GameState.promotionPending) return;

    const clickedPiece = GameState.board[row][col];

    // If a piece is already selected
    if (GameState.selectedPiece) {
        const move = GameState.validMoves.find(m => m.row === row && m.col === col);

        if (move) {
            // Execute move
            executeMove(GameState.selectedPiece, row, col, move);
            return;
        }

        // If clicked on own piece, select it instead
        if (clickedPiece && clickedPiece.color === GameState.currentPlayer) {
            selectPiece(clickedPiece);
            return;
        }

        // Deselect
        deselectPiece();
        return;
    }

    // Select a piece
    if (clickedPiece && clickedPiece.color === GameState.currentPlayer) {
        selectPiece(clickedPiece);
    }
}

function selectPiece(piece) {
    GameState.selectedPiece = piece;
    GameState.validMoves = getValidMoves(piece);
    playSound('select');
    renderBoard();
}

function deselectPiece() {
    GameState.selectedPiece = null;
    GameState.validMoves = [];
    renderBoard();
}

// ============================================
// MOVE VALIDATION
// ============================================

function getValidMoves(piece) {
    const moves = getRawMoves(piece);
    // Filter out moves that leave king in check
    return moves.filter(move => {
        const testBoard = copyBoard(GameState.board);
        testBoard[move.row][move.col] = { ...piece, row: move.row, col: move.col };
        testBoard[piece.row][piece.col] = null;

        // Handle en passant capture in test
        if (move.enPassant) {
            testBoard[piece.row][move.col] = null;
        }

        return !isKingInCheck(piece.color, testBoard);
    });
}

function getRawMoves(piece) {
    const moves = [];
    const { row, col, type, color } = piece;

    switch (type) {
        case 'pawn':
            getPawnMoves(piece, moves);
            break;
        case 'rook':
            getSlidingMoves(piece, [[0,1],[0,-1],[1,0],[-1,0]], moves);
            break;
        case 'bishop':
            getSlidingMoves(piece, [[1,1],[1,-1],[-1,1],[-1,-1]], moves);
            break;
        case 'queen':
            getSlidingMoves(piece, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]], moves);
            break;
        case 'knight':
            getKnightMoves(piece, moves);
            break;
        case 'king':
            getKingMoves(piece, moves);
            break;
    }

    return moves;
}

function getPawnMoves(piece, moves) {
    const { row, col, color } = piece;
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Forward move
    if (isValidPos(row + direction, col) && !GameState.board[row + direction][col]) {
        moves.push({ row: row + direction, col: col, promotion: (row + direction === 0 || row + direction === 7) });

        // Double move from start
        if (row === startRow && !GameState.board[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col: col, doublePush: true });
        }
    }

    // Captures
    for (const dc of [-1, 1]) {
        const newCol = col + dc;
        if (isValidPos(row + direction, newCol)) {
            const target = GameState.board[row + direction][newCol];
            if (target && target.color !== color) {
                moves.push({ row: row + direction, col: newCol, capture: true, promotion: (row + direction === 0 || row + direction === 7) });
            }
            // En passant
            if (GameState.enPassantTarget && 
                GameState.enPassantTarget.row === row + direction && 
                GameState.enPassantTarget.col === newCol) {
                moves.push({ row: row + direction, col: newCol, enPassant: true });
            }
        }
    }
}

function getSlidingMoves(piece, directions, moves) {
    const { row, col, color } = piece;
    for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
            const newRow = row + dr * i;
            const newCol = col + dc * i;
            if (!isValidPos(newRow, newCol)) break;

            const target = GameState.board[newRow][newCol];
            if (!target) {
                moves.push({ row: newRow, col: newCol });
            } else {
                if (target.color !== color) {
                    moves.push({ row: newRow, col: newCol, capture: true });
                }
                break;
            }
        }
    }
}

function getKnightMoves(piece, moves) {
    const { row, col, color } = piece;
    const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of jumps) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPos(newRow, newCol)) {
            const target = GameState.board[newRow][newCol];
            if (!target) {
                moves.push({ row: newRow, col: newCol });
            } else if (target.color !== color) {
                moves.push({ row: newRow, col: newCol, capture: true });
            }
        }
    }
}

function getKingMoves(piece, moves) {
    const { row, col, color } = piece;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPos(newRow, newCol)) {
            const target = GameState.board[newRow][newCol];
            if (!target) {
                moves.push({ row: newRow, col: newCol });
            } else if (target.color !== color) {
                moves.push({ row: newRow, col: newCol, capture: true });
            }
        }
    }

    // Castling
    if (!piece.hasMoved && !isKingInCheck(color, GameState.board)) {
        // King side
        if (canCastle(color, 'kingSide')) {
            moves.push({ row: row, col: col + 2, castling: 'kingSide' });
        }
        // Queen side
        if (canCastle(color, 'queenSide')) {
            moves.push({ row: row, col: col - 2, castling: 'queenSide' });
        }
    }
}

function canCastle(color, side) {
    const row = color === 'white' ? 7 : 0;
    const rights = GameState.castlingRights;

    if (color === 'white') {
        if (side === 'kingSide' && !rights.whiteKingSide) return false;
        if (side === 'queenSide' && !rights.whiteQueenSide) return false;
    } else {
        if (side === 'kingSide' && !rights.blackKingSide) return false;
        if (side === 'queenSide' && !rights.blackQueenSide) return false;
    }

    const rookCol = side === 'kingSide' ? 7 : 0;
    const rook = GameState.board[row][rookCol];
    if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;

    // Check squares between are empty
    const start = side === 'kingSide' ? 5 : 1;
    const end = side === 'kingSide' ? 7 : 4;
    for (let c = start; c < end; c++) {
        if (GameState.board[row][c]) return false;
    }

    // Check king doesn't pass through check
    const kingCol = 4;
    const direction = side === 'kingSide' ? 1 : -1;
    for (let i = 1; i <= 2; i++) {
        const testBoard = copyBoard(GameState.board);
        testBoard[row][kingCol + i * direction] = testBoard[row][kingCol];
        testBoard[row][kingCol] = null;
        if (isKingInCheck(color, testBoard)) return false;
    }

    return true;
}

function isValidPos(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function copyBoard(board) {
    return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

// ============================================
// CHECK DETECTION
// ============================================

function isKingInCheck(color, board = GameState.board) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.type === 'king' && p.color === color) {
                kingPos = { row: r, col: c };
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return false;

    const opponent = color === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === opponent) {
                const rawMoves = getRawMovesFromBoard(p, board);
                if (rawMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getRawMovesFromBoard(piece, board) {
    // Temporary swap board for raw move calculation
    const savedBoard = GameState.board;
    GameState.board = board;
    const moves = getRawMoves(piece);
    GameState.board = savedBoard;
    return moves;
}

// ============================================
// MOVE EXECUTION
// ============================================

function executeMove(piece, toRow, toCol, moveInfo) {
    const fromRow = piece.row;
    const fromCol = piece.col;
    const targetPiece = GameState.board[toRow][toCol];

    // Handle capture
    if (targetPiece) {
        GameState.capturedPieces[piece.color].push(targetPiece);
        playSound('capture');
        showCombatEffect(toRow, toCol);
    } else {
        playSound('move');
    }

    // Handle en passant capture
    let enPassantCaptured = null;
    if (moveInfo.enPassant) {
        enPassantCaptured = GameState.board[fromRow][toCol];
        GameState.capturedPieces[piece.color].push(enPassantCaptured);
        GameState.board[fromRow][toCol] = null;
        playSound('capture');
    }

    // Update board
    GameState.board[toRow][toCol] = { ...piece, row: toRow, col: toCol, hasMoved: true };
    GameState.board[fromRow][fromCol] = null;

    // Handle castling
    if (moveInfo.castling) {
        const row = piece.row;
        if (moveInfo.castling === 'kingSide') {
            GameState.board[row][5] = GameState.board[row][7];
            GameState.board[row][5].col = 5;
            GameState.board[row][5].hasMoved = true;
            GameState.board[row][7] = null;
        } else {
            GameState.board[row][3] = GameState.board[row][0];
            GameState.board[row][3].col = 3;
            GameState.board[row][3].hasMoved = true;
            GameState.board[row][0] = null;
        }
        playSound('castle');
    }

    // Update en passant target
    if (moveInfo.doublePush) {
        GameState.enPassantTarget = { 
            row: (fromRow + toRow) / 2, 
            col: fromCol 
        };
    } else {
        GameState.enPassantTarget = null;
    }

    // Update castling rights
    if (piece.type === 'king') {
        if (piece.color === 'white') {
            GameState.castlingRights.whiteKingSide = false;
            GameState.castlingRights.whiteQueenSide = false;
        } else {
            GameState.castlingRights.blackKingSide = false;
            GameState.castlingRights.blackQueenSide = false;
        }
    }
    if (piece.type === 'rook') {
        if (piece.color === 'white') {
            if (fromCol === 7) GameState.castlingRights.whiteKingSide = false;
            if (fromCol === 0) GameState.castlingRights.whiteQueenSide = false;
        } else {
            if (fromCol === 7) GameState.castlingRights.blackKingSide = false;
            if (fromCol === 0) GameState.castlingRights.blackQueenSide = false;
        }
    }

    // Check if rook was captured (affects castling)
    if (targetPiece && targetPiece.type === 'rook') {
        if (targetPiece.color === 'white') {
            if (toCol === 7 && toRow === 7) GameState.castlingRights.whiteKingSide = false;
            if (toCol === 0 && toRow === 7) GameState.castlingRights.whiteQueenSide = false;
        } else {
            if (toCol === 7 && toRow === 0) GameState.castlingRights.blackKingSide = false;
            if (toCol === 0 && toRow === 0) GameState.castlingRights.blackQueenSide = false;
        }
    }

    // Record move
    const moveNotation = getMoveNotation(piece, fromRow, fromCol, toRow, toCol, targetPiece || enPassantCaptured, moveInfo);
    GameState.moveHistory.push({
        piece: piece,
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        notation: moveNotation,
        capture: !!(targetPiece || enPassantCaptured)
    });

    GameState.lastMove = { fromRow, fromCol, toRow, toCol };

    // Handle promotion
    if (moveInfo.promotion) {
        GameState.promotionPending = { row: toRow, col: toCol, color: piece.color };
        showPromotionModal(piece.color);
        deselectPiece();
        renderBoard();
        return;
    }

    // Update half move clock
    if (piece.type === 'pawn' || targetPiece || enPassantCaptured) {
        GameState.halfMoveClock = 0;
    } else {
        GameState.halfMoveClock++;
    }

    // Update full move number
    if (GameState.currentPlayer === 'black') {
        GameState.fullMoveNumber++;
    }

    // Switch turn
    GameState.currentPlayer = GameState.currentPlayer === 'white' ? 'black' : 'white';

    // Check for check
    GameState.inCheck = isKingInCheck(GameState.currentPlayer);
    if (GameState.inCheck) {
        playSound('check');
    }

    // Check for game end
    checkGameEnd();

    deselectPiece();
    renderBoard();
    updateHUD();
    addMoveToHistory(moveNotation);

    // AI turn
    if (GameState.gameMode === 'ai' && GameState.currentPlayer === 'black' && !GameState.gameOver) {
        setTimeout(() => makeAIMove(), 500);
    }
}

function getMoveNotation(piece, fromRow, fromCol, toRow, toCol, captured, moveInfo) {
    const files = 'abcdefgh';
    const ranks = '87654321';

    let notation = '';

    if (moveInfo.castling) {
        return moveInfo.castling === 'kingSide' ? 'O-O' : 'O-O-O';
    }

    // Piece letter (except pawn)
    if (piece.type !== 'pawn') {
        notation += piece.type.charAt(0).toUpperCase();
    }

    // Disambiguation (simplified)
    // For full disambiguation, we'd need to check for multiple pieces of same type

    // Capture
    if (captured) {
        if (piece.type === 'pawn') {
            notation += files[fromCol];
        }
        notation += 'x';
    }

    // Destination
    notation += files[toCol] + ranks[toRow];

    // Promotion
    if (moveInfo.promotion) {
        notation += '=Q'; // Default, will be updated
    }

    return notation;
}

// ============================================
// PROMOTION
// ============================================

function showPromotionModal(color) {
    const modal = document.getElementById('promotion-modal');
    const options = document.getElementById('promotion-options');
    options.innerHTML = '';

    const pieces = ['queen', 'rook', 'bishop', 'knight'];
    pieces.forEach(type => {
        const btn = document.createElement('div');
        btn.className = 'promo-piece';
        btn.textContent = PIECES[color][type];
        btn.addEventListener('click', () => promotePiece(type));
        options.appendChild(btn);
    });

    modal.classList.add('active');
}

function promotePiece(type) {
    if (!GameState.promotionPending) return;

    const { row, col, color } = GameState.promotionPending;
    GameState.board[row][col] = {
        type: type,
        color: color,
        row: row,
        col: col,
        hasMoved: true,
        id: `${type}_${color === 'white' ? 'w' : 'b'}_${row}_${col}_${Date.now()}`
    };

    // Update last move notation with promotion
    if (GameState.moveHistory.length > 0) {
        const lastMove = GameState.moveHistory[GameState.moveHistory.length - 1];
        lastMove.notation = lastMove.notation.replace('=Q', '=' + type.charAt(0).toUpperCase());
        updateLastHistoryEntry(lastMove.notation);
    }

    GameState.promotionPending = null;
    document.getElementById('promotion-modal').classList.remove('active');

    // Check for check after promotion
    GameState.inCheck = isKingInCheck(GameState.currentPlayer);
    if (GameState.inCheck) {
        playSound('check');
    }

    checkGameEnd();
    renderBoard();

    if (GameState.gameMode === 'ai' && GameState.currentPlayer === 'black' && !GameState.gameOver) {
        setTimeout(() => makeAIMove(), 500);
    }
}

// ============================================
// GAME END DETECTION
// ============================================

function checkGameEnd() {
    const color = GameState.currentPlayer;

    // Check for checkmate or stalemate
    let hasValidMoves = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = GameState.board[r][c];
            if (p && p.color === color) {
                const moves = getValidMoves(p);
                if (moves.length > 0) {
                    hasValidMoves = true;
                    break;
                }
            }
        }
        if (hasValidMoves) break;
    }

    if (!hasValidMoves) {
        if (GameState.inCheck) {
            // Checkmate
            const winner = color === 'white' ? 'Black' : 'White';
            endGame('checkmate', winner);
        } else {
            // Stalemate
            endGame('stalemate', null);
        }
        return;
    }

    // Fifty-move rule
    if (GameState.halfMoveClock >= 100) {
        endGame('fiftyMove', null);
        return;
    }

    // Insufficient material (simplified check)
    if (isInsufficientMaterial()) {
        endGame('insufficient', null);
        return;
    }
}

function isInsufficientMaterial() {
    const pieces = { white: [], black: [] };
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = GameState.board[r][c];
            if (p) pieces[p.color].push(p);
        }
    }

    // King vs King
    if (pieces.white.length === 1 && pieces.black.length === 1) return true;

    // King and minor piece vs King
    if (pieces.white.length === 1 && pieces.black.length === 2) {
        const minor = pieces.black.find(p => p.type === 'bishop' || p.type === 'knight');
        if (minor) return true;
    }
    if (pieces.black.length === 1 && pieces.white.length === 2) {
        const minor = pieces.white.find(p => p.type === 'bishop' || p.type === 'knight');
        if (minor) return true;
    }

    return false;
}

function endGame(reason, winner) {
    GameState.gameOver = true;

    const modal = document.getElementById('gameover-modal');
    const title = document.getElementById('winner-text');
    const sub = document.getElementById('winner-sub');

    if (reason === 'checkmate') {
        title.textContent = `${winner} Wins!`;
        sub.textContent = 'Checkmate — The battle is over';
        playSound('victory');
    } else if (reason === 'stalemate') {
        title.textContent = 'Stalemate';
        sub.textContent = 'No valid moves remain';
        playSound('draw');
    } else if (reason === 'fiftyMove') {
        title.textContent = 'Draw';
        sub.textContent = 'Fifty-move rule';
        playSound('draw');
    } else if (reason === 'insufficient') {
        title.textContent = 'Draw';
        sub.textContent = 'Insufficient material';
        playSound('draw');
    }

    setTimeout(() => {
        modal.classList.add('active');
    }, 800);
}

// ============================================
// HUD & UI UPDATES
// ============================================

function updateHUD() {
    const turnText = document.getElementById('turn-text');
    if (turnText) {
        turnText.textContent = GameState.currentPlayer === 'white' ? "White's Turn" : "Black's Turn";
        turnText.style.color = GameState.currentPlayer === 'white' ? '#f5f5f0' : '#888';
    }

    // Update captured pieces display
    const capWhite = document.getElementById('captured-white');
    const capBlack = document.getElementById('captured-black');

    if (capWhite) {
        capWhite.innerHTML = GameState.capturedPieces.black
            .map(p => `<span>${PIECES[p.color][p.type]}</span>`)
            .join('');
    }
    if (capBlack) {
        capBlack.innerHTML = GameState.capturedPieces.white
            .map(p => `<span>${PIECES[p.color][p.type]}</span>`)
            .join('');
    }

    // Update score
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        const whiteScore = calculateScore('white');
        const blackScore = calculateScore('black');
        scoreEl.textContent = `${whiteScore} - ${blackScore}`;
    }
}

function calculateScore(color) {
    let score = 0;
    GameState.capturedPieces[color].forEach(p => {
        score += PIECE_VALUES[p.type] || 0;
    });
    return Math.floor(score / 100);
}

function addMoveToHistory(notation) {
    const history = document.getElementById('move-history');
    if (!history) return;

    const moveNum = Math.ceil(GameState.moveHistory.length / 2);
    const isWhiteMove = GameState.moveHistory.length % 2 === 1;

    if (isWhiteMove) {
        const entry = document.createElement('div');
        entry.className = 'move-entry';
        entry.innerHTML = `
            <span class="move-number">${moveNum}.</span>
            <span class="move-white">${notation}</span>
            <span class="move-black" id="move-b-${moveNum}"></span>
        `;
        history.appendChild(entry);
    } else {
        const blackSpan = document.getElementById(`move-b-${moveNum}`);
        if (blackSpan) blackSpan.textContent = notation;
    }

    history.scrollTop = history.scrollHeight;
}

function updateLastHistoryEntry(notation) {
    const history = document.getElementById('move-history');
    if (!history) return;
    const entries = history.querySelectorAll('.move-entry');
    if (entries.length === 0) return;

    const lastEntry = entries[entries.length - 1];
    const isWhiteMove = GameState.moveHistory.length % 2 === 1;

    if (isWhiteMove) {
        lastEntry.querySelector('.move-white').textContent = notation;
    } else {
        const blackSpan = lastEntry.querySelector('.move-black');
        if (blackSpan) blackSpan.textContent = notation;
    }
}

function clearMoveHistory() {
    const history = document.getElementById('move-history');
    if (history) history.innerHTML = '';
}

// ============================================
// TIMER
// ============================================

let timerInterval = null;
let seconds = 0;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const timer = document.getElementById('timer');
        if (timer && document.getElementById('game-screen').classList.contains('active')) {
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timer.textContent = `${mins}:${secs}`;
        }
    }, 1000);
}

// ============================================
// SETTINGS
// ============================================

function toggleSound() {
    GameState.soundEnabled = !GameState.soundEnabled;
    const btn = event.target;
    btn.textContent = GameState.soundEnabled ? '🔊 Sound' : '🔇 Muted';
}

// Settings listeners
document.addEventListener('DOMContentLoaded', () => {
    const sfxSlider = document.getElementById('sfx-volume');
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            setVolume(e.target.value / 100);
        });
    }

    const animSlider = document.getElementById('anim-speed');
    if (animSlider) {
        animSlider.addEventListener('input', (e) => {
            GameState.animSpeed = parseInt(e.target.value);
        });
    }

    const hintsCheck = document.getElementById('show-hints');
    if (hintsCheck) {
        hintsCheck.addEventListener('change', (e) => {
            GameState.showHints = e.target.checked;
        });
    }
});

// ============================================
// COMBAT EFFECTS
// ============================================

function showCombatEffect(row, col) {
    const overlay = document.getElementById('combat-overlay');
    const effect = document.getElementById('combat-effect');

    // Calculate position based on board square
    const board = document.getElementById('chess-board');
    if (!board) return;

    const squareSize = board.offsetWidth / 8;
    const boardRect = board.getBoundingClientRect();

    const x = boardRect.left + col * squareSize + squareSize / 2;
    const y = boardRect.top + row * squareSize + squareSize / 2;

    effect.style.left = `${x - 50}px`;
    effect.style.top = `${y - 50}px`;

    overlay.classList.add('active');

    setTimeout(() => {
        overlay.classList.remove('active');
    }, 600);
}

// ============================================
// AI INTEGRATION (calls from ai.js)
// ============================================

function makeAIMove() {
    if (GameState.gameOver) return;

    GameState.aiThinking = true;
    document.getElementById('turn-text').textContent = 'AI Thinking...';

    // Use setTimeout to allow UI update before heavy computation
    setTimeout(() => {
        const move = findBestMove(GameState.difficulty);

        if (move) {
            const piece = GameState.board[move.fromRow][move.fromCol];
            if (piece) {
                const moveInfo = getValidMoves(piece).find(m => 
                    m.row === move.toRow && m.col === move.toCol
                ) || { row: move.toRow, col: move.toCol };
                executeMove(piece, move.toRow, move.toCol, moveInfo);
            }
        }

        GameState.aiThinking = false;
    }, 300);
}

// ============================================
// EXPORT FOR OTHER MODULES
// ============================================
window.GameState = GameState;
window.PIECES = PIECES;
window.PIECE_VALUES = PIECE_VALUES;
window.copyBoard = copyBoard;
window.isKingInCheck = isKingInCheck;
window.getValidMoves = getValidMoves;
window.getRawMoves = getRawMoves;
window.isValidPos = isValidPos;
window.getPieceChar = getPieceChar;
window.getPieceType = getPieceType;
