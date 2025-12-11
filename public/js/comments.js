// comments.js - Comment Management System

// Comment data structure
// comments.js - Đảm bảo khởi tạo
window.commentsData = JSON.parse(localStorage.getItem('pickleball_comments') || '[]');

function initComments() {
    // Đảm bảo dữ liệu không bị undefined
    if (!window.commentsData) {
        window.commentsData = [];
        localStorage.setItem('pickleball_comments', '[]');
    }
    
    console.log('Comments initialized:', window.commentsData.length, 'comments');
}

// Khởi tạo ngay
initComments();

// Get total comment count
function getTotalComments() {
    let total = window.commentsData.length;
    window.commentsData.forEach(comment => {
        if (comment.replies) total += comment.replies.length;
    });
    return total;
}

// Get comments by user
function getUserComments(username) {
    let count = 0;
    
    window.commentsData.forEach(comment => {
        if (comment.author === username) count++;
        if (comment.replies) {
            comment.replies.forEach(reply => {
                if (reply.author === username) count++;
            });
        }
    });
    
    return count;
}

// Find comment by ID (including replies)
function findCommentById(commentId) {
    // Search in main comments
    for (let comment of window.commentsData) {
        if (comment.id === commentId) return comment;
        
        // Search in replies
        if (comment.replies) {
            for (let reply of comment.replies) {
                if (reply.id === commentId) return reply;
            }
        }
    }
    return null;
}

// Save comments to localStorage
function saveComments() {
    localStorage.setItem('pickleball_comments', JSON.stringify(window.commentsData));
}

// Initialize when loaded
initComments();