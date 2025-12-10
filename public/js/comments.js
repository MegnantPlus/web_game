// comments.js - Comment Management System
class CommentsSystem {
    constructor() {
        this.comments = [];
        this.loadComments();
    }
    
    loadComments() {
        try {
            const saved = localStorage.getItem('pickleball_comments');
            if (saved) {
                this.comments = JSON.parse(saved);
                // Initialize missing fields
                this.comments.forEach(comment => {
                    if (!comment.id) comment.id = Date.now();
                    if (!comment.votedUsers) comment.votedUsers = {};
                    if (!comment.voteScore) comment.voteScore = 0;
                    if (!comment.replies) comment.replies = [];
                    
                    comment.replies.forEach(reply => {
                        if (!reply.id) reply.id = Date.now();
                        if (!reply.votedUsers) reply.votedUsers = {};
                        if (!reply.voteScore) reply.voteScore = 0;
                    });
                });
            }
        } catch (e) {
            console.error('Error loading comments:', e);
            this.comments = [];
        }
    }
    
    saveComments() {
        try {
            localStorage.setItem('pickleball_comments', JSON.stringify(this.comments));
        } catch (e) {
            console.error('Error saving comments:', e);
        }
    }
    
    addComment(content, author) {
        const newComment = {
            id: Date.now(),
            author: author,
            content: content,
            timestamp: Date.now(),
            voteScore: 0,
            votedUsers: {},
            replies: []
        };
        
        this.comments.unshift(newComment);
        this.saveComments();
        return newComment;
    }
    
    addReply(commentId, content, author) {
        const comment = this.findCommentById(commentId);
        if (!comment) return null;
        
        const newReply = {
            id: Date.now(),
            author: author,
            content: content,
            timestamp: Date.now(),
            voteScore: 0,
            votedUsers: {},
            parentId: commentId
        };
        
        if (!comment.replies) comment.replies = [];
        comment.replies.unshift(newReply);
        this.saveComments();
        return newReply;
    }
    
    deleteComment(commentId) {
        this.comments = this.comments.filter(comment => comment.id !== commentId);
        // Also check replies
        this.comments.forEach(comment => {
            if (comment.replies) {
                comment.replies = comment.replies.filter(reply => reply.id !== commentId);
            }
        });
        this.saveComments();
    }
    
    voteComment(commentId, userId, voteType) {
        const comment = this.findCommentById(commentId);
        if (!comment || !userId) return false;
        
        const currentVote = comment.votedUsers[userId];
        
        if (currentVote === voteType) {
            // Remove vote
            delete comment.votedUsers[userId];
            comment.voteScore -= (voteType === 'up' ? 1 : -1);
        } else {
            // Change vote
            if (currentVote) {
                comment.voteScore -= (currentVote === 'up' ? 1 : -1);
            }
            comment.votedUsers[userId] = voteType;
            comment.voteScore += (voteType === 'up' ? 1 : -1);
        }
        
        this.saveComments();
        return true;
    }
    
    findCommentById(commentId) {
        // Search in main comments
        for (let comment of this.comments) {
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
    
    getUserComments(username) {
        let count = 0;
        
        this.comments.forEach(comment => {
            if (comment.author === username) count++;
            if (comment.replies) {
                comment.replies.forEach(reply => {
                    if (reply.author === username) count++;
                });
            }
        });
        
        return count;
    }
    
    getTotalComments() {
        let total = this.comments.length;
        this.comments.forEach(comment => {
            if (comment.replies) total += comment.replies.length;
        });
        return total;
    }
}

// Create global instance
window.commentsSystem = new CommentsSystem();