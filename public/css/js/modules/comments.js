// modules/comments.js
export class CommentManager {
    constructor(userSystem) {
        this.userSystem = userSystem;
        this.comments = [];
        this.currentCommentPage = 1;
        this.commentsPerPage = 10;
    }

    loadCommentsFromStorage() {
        // ... (code từ file.js dòng 220-250)
    }

    renderComments() {
        // ... (code từ file.js dòng 340-370)
    }

    submitComment() {
        // ... (code từ file.js dòng 450-480)
    }

    // ... các hàm khác liên quan đến comment
}