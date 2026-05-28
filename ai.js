/* ============================================
   ROYAL CHESS 3D — AI Engine
   Minimax with Alpha-Beta Pruning
   3 Difficulty Levels: Easy, Medium, Hard
   Optimized for browser performance
   ============================================ */

// ============================================
// AI CONFIGURATION
// ============================================
const AI_CONFIG = {
    easy:   { depth: 1, randomness: 0.4 },
    medium: { depth: 2, randomness: 0.15 },
    hard:   { depth: 3, randomness: 0.05 }
};

// Position evaluation tables (Piece-Square Tables)
// Higher values = better position for that piece
const PST = {
    pawn: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    knight: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    bishop: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    rook: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    queen: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    king: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

// ============================================
// MAIN AI FUNCTION
// ============================================

function findBestMove(difficulty) {
    const config = AI_CONFIG[difficulty] || AI_CONFIG.medium;
    const depth = config.depth;
    const randomness = config.randomness;

    const board = window.GameState.board;
    const color = 'black'; // AI always plays black

    // Get all possible moves
    const allMoves = getAllValidMoves(color, board);

    if (allMoves.length === 0) return null;

    // For easy mode, add randomness
    if (difficulty === 'easy' && Math.random() < randomness) {
        return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    let bestMove = null;
    let bestScore = -Infinity;

    // Sort moves for better alpha-beta pruning
    // Captures and checks first
    const sortedMoves = sortMoves(allMoves, board, color);

    for (const move of sortedMoves) {
        const testBoard = simulateMove(board, move);
        const score = minimax(testBoard, depth - 1, -Infinity, Infinity, false, color);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    // For medium, occasionally pick 2nd best move
    if (difficulty === 'medium' && Math.random() < randomness && sortedMoves.length > 1) {
        const secondBest = sortedMoves.find(m => m !== bestMove);
        if (secondBest) bestMove = secondBest;
    }

    return bestMove;
}

// ============================================
// MINIMAX WITH ALPHA-BETA PRUNING
// ============================================

function minimax(board, depth, alpha, beta, isMaximizing, aiColor) {
    const currentColor = isMaximizing ? aiColor : (aiColor === 'white' ? 'black' : 'white');

    // Terminal conditions
    if (depth === 0) {
        return evaluateBoard(board, aiColor);
    }

    const moves = getAllValidMoves(currentColor, board);

    // Checkmate / Stalemate detection
    if (moves.length === 0) {
        if (isKingInCheck(currentColor, board)) {
            // Checkmate - bad for current player
            return isMaximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
        }
        // Stalemate
        return 0;
    }

    const sortedMoves = sortMoves(moves, board, currentColor);

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of sortedMoves) {
            const testBoard = simulateMove(board, move);
            const score = minimax(testBoard, depth - 1, alpha, beta, false, aiColor);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break; // Alpha-beta pruning
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (const move of sortedMoves) {
            const testBoard = simulateMove(board, move);
            const score = minimax(testBoard, depth - 1, alpha, beta, true, aiColor);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break; // Alpha-beta pruning
        }
        return minScore;
    }
}

// ============================================
// BOARD EVALUATION
// ============================================

function evaluateBoard(board, aiColor) {
    let score = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece) continue;

            const isAI = piece.color === aiColor;
            const multiplier = isAI ? 1 : -1;

            // Material value
            const materialValue = window.PIECE_VALUES[piece.type] || 0;
            score += materialValue * multiplier;

            // Position value from PST
            const pstRow = piece.color === 'white' ? row : (7 - row);
            const pst = PST[piece.type];
            if (pst && pst[pstRow] && pst[pstRow][col] !== undefined) {
                score += pst[pstRow][col] * multiplier;
            }

            // Mobility bonus
            const mobilityMoves = getRawMovesFromBoard(piece, board);
            score += mobilityMoves.length * 5 * multiplier;

            // King safety (penalize exposed king)
            if (piece.type === 'king') {
                const pawnShield = countPawnShield(piece, board);
                score += pawnShield * 10 * multiplier;
            }
        }
    }

    // Check bonus
    const opponent = aiColor === 'white' ? 'black' : 'white';
    if (isKingInCheck(opponent, board)) {
        score += 50;
    }
    if (isKingInCheck(aiColor, board)) {
        score -= 50;
    }

    return score;
}

function countPawnShield(king, board) {
    let count = 0;
    const direction = king.color === 'white' ? -1 : 1;
    for (let dc = -1; dc <= 1; dc++) {
        const r = king.row + direction;
        const c = king.col + dc;
        if (isValidPos(r, c)) {
            const p = board[r][c];
            if (p && p.type === 'pawn' && p.color === king.color) {
                count++;
            }
        }
    }
    return count;
}

// ============================================
// MOVE GENERATION FOR AI
// ============================================

function getAllValidMoves(color, board) {
    const moves = [];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === color) {
                const rawMoves = getRawMovesFromBoard(piece, board);

                for (const move of rawMoves) {
                    // Validate move doesn't leave king in check
                    const testBoard = simulateMove(board, { 
                        fromRow: row, fromCol: col, 
                        toRow: move.row, toCol: move.col,
                        piece: piece, moveInfo: move
                    });

                    if (!isKingInCheck(color, testBoard)) {
                        moves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col,
                            piece: piece,
                            moveInfo: move,
                            score: estimateMoveValue(piece, move, board)
                        });
                    }
                }
            }
        }
    }

    return moves;
}

function simulateMove(board, move) {
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
    const { fromRow, fromCol, toRow, toCol, moveInfo } = move;

    const piece = newBoard[fromRow][fromCol];
    if (!piece) return newBoard;

    newBoard[toRow][toCol] = { ...piece, row: toRow, col: toCol, hasMoved: true };
    newBoard[fromRow][fromCol] = null;

    // Handle en passant
    if (moveInfo && moveInfo.enPassant) {
        newBoard[fromRow][toCol] = null;
    }

    // Handle castling
    if (moveInfo && moveInfo.castling) {
        const row = fromRow;
        if (moveInfo.castling === 'kingSide') {
            newBoard[row][5] = newBoard[row][7];
            if (newBoard[row][5]) {
                newBoard[row][5].col = 5;
                newBoard[row][5].hasMoved = true;
            }
            newBoard[row][7] = null;
        } else if (moveInfo.castling === 'queenSide') {
            newBoard[row][3] = newBoard[row][0];
            if (newBoard[row][3]) {
                newBoard[row][3].col = 3;
                newBoard[row][3].hasMoved = true;
            }
            newBoard[row][0] = null;
        }
    }

    return newBoard;
}

function sortMoves(moves, board, color) {
    return moves.sort((a, b) => {
        // Prioritize captures
        const aCapture = a.moveInfo && (a.moveInfo.capture || a.moveInfo.enPassant);
        const bCapture = b.moveInfo && (b.moveInfo.capture || b.moveInfo.enPassant);

        if (aCapture && !bCapture) return -1;
        if (!aCapture && bCapture) return 1;

        // Prioritize checks
        const aCheck = a.moveInfo && a.moveInfo.givesCheck;
        const bCheck = b.moveInfo && b.moveInfo.givesCheck;

        if (aCheck && !bCheck) return -1;
        if (!aCheck && bCheck) return 1;

        // Use estimated value
        return b.score - a.score;
    });
}

function estimateMoveValue(piece, move, board) {
    let value = 0;

    // Capture value
    if (move.capture || move.enPassant) {
        const target = board[move.row][move.col];
        if (target) {
            value += (window.PIECE_VALUES[target.type] || 0) * 10;
        } else if (move.enPassant) {
            value += window.PIECE_VALUES.pawn * 10;
        }
    }

    // Promotion value
    if (move.promotion) {
        value += window.PIECE_VALUES.queen;
    }

    // Center control bonus
    if ((move.row === 3 || move.row === 4) && (move.col === 3 || move.col === 4)) {
        value += 20;
    }

    // Development bonus for knights and bishops
    if ((piece.type === 'knight' || piece.type === 'bishop') && !piece.hasMoved) {
        value += 15;
    }

    return value;
}

// ============================================
// HELPER FUNCTIONS (wrappers for engine.js)
// ============================================

function getRawMovesFromBoard(piece, board) {
    const savedBoard = window.GameState.board;
    window.GameState.board = board;
    const moves = window.getRawMoves(piece);
    window.GameState.board = savedBoard;
    return moves;
}

function isKingInCheck(color, board) {
    return window.isKingInCheck(color, board);
}

function isValidPos(row, col) {
    return window.isValidPos(row, col);
}

// ============================================
// EXPORT
// ============================================
window.findBestMove = findBestMove;
window.AI_CONFIG = AI_CONFIG;
