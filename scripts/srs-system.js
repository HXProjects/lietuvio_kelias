// Spaced Repetition System (SRS) Implementation
class SRSSystem {
    constructor() {
        this.intervals = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]; // Days between reviews
        this.maxLevel = 10;
    }

    // Calculate the next review date based on SRS level and performance
    calculateNextReview(currentLevel, correct, streakMultiplier = 1) {
        let newLevel = currentLevel;
        
        if (correct) {
            // Move to next level if answer was correct
            newLevel = Math.min(currentLevel + 1, this.maxLevel);
        } else {
            // Reset to level 1 if answer was incorrect, or decrease by 2 levels
            newLevel = Math.max(1, currentLevel - 2);
        }

        // Get interval for new level
        const baseInterval = this.intervals[newLevel - 1] || this.intervals[this.intervals.length - 1];
        
        // Apply streak multiplier for consecutive correct answers
        const actualInterval = Math.floor(baseInterval * streakMultiplier);
        
        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + actualInterval);
        
        return {
            newLevel: newLevel,
            nextReviewDate: nextReview,
            intervalDays: actualInterval
        };
    }

    // Determine if a word is due for review
    isDueForReview(nextReviewDate) {
        const now = new Date();
        const reviewDate = new Date(nextReviewDate);
        return reviewDate <= now;
    }

    // Get difficulty multiplier based on user's self-assessment
    getDifficultyMultiplier(userRating) {
        // userRating: 1 = difficult, 2 = medium, 3 = easy
        switch (userRating) {
            case 1: return 0.5; // Difficult - shorter interval
            case 2: return 1.0; // Medium - normal interval
            case 3: return 1.5; // Easy - longer interval
            default: return 1.0;
        }
    }

    // Calculate retention rate for a word
    calculateRetentionRate(correctAnswers, totalReviews) {
        if (totalReviews === 0) return 0;
        return (correctAnswers / totalReviews) * 100;
    }

    // Suggest optimal study session size based on due words
    suggestStudySession(dueWords, targetSessionLength = 20) {
        if (dueWords.length === 0) {
            return {
                recommended: [],
                message: "No words due for review! Great job staying on track."
            };
        }

        // Sort by priority (lower level words first, then by due date)
        const sorted = dueWords.sort((a, b) => {
            if (a.srsData.level !== b.srsData.level) {
                return a.srsData.level - b.srsData.level;
            }
            return new Date(a.srsData.nextReview) - new Date(b.srsData.nextReview);
        });

        const recommended = sorted.slice(0, targetSessionLength);
        
        let message = `${recommended.length} words ready for review.`;
        if (dueWords.length > targetSessionLength) {
            message += ` ${dueWords.length - targetSessionLength} more words are also due.`;
        }

        return {
            recommended: recommended,
            totalDue: dueWords.length,
            message: message
        };
    }

    // Generate learning statistics
    generateStats(words) {
        const now = new Date();
        const stats = {
            totalWords: words.length,
            averageLevel: 0,
            distribution: {
                beginner: 0,    // Level 1-3
                intermediate: 0, // Level 4-6
                advanced: 0,    // Level 7-8
                mastered: 0     // Level 9-10
            },
            reviewsToday: 0,
            streakDays: this.calculateStreak(words),
            retentionRate: 0
        };

        if (words.length === 0) return stats;

        let totalLevel = 0;
        let totalCorrect = 0;
        let totalReviews = 0;
        const today = now.toDateString();

        words.forEach(word => {
            const level = word.srsData.level;
            totalLevel += level;
            totalCorrect += word.srsData.correctAnswers;
            totalReviews += word.srsData.totalReviews;

            // Categorize by level
            if (level <= 3) stats.distribution.beginner++;
            else if (level <= 6) stats.distribution.intermediate++;
            else if (level <= 8) stats.distribution.advanced++;
            else stats.distribution.mastered++;

            // Count reviews today
            if (word.srsData.lastReviewed) {
                const reviewDate = new Date(word.srsData.lastReviewed);
                if (reviewDate.toDateString() === today) {
                    stats.reviewsToday++;
                }
            }
        });

        stats.averageLevel = (totalLevel / words.length).toFixed(1);
        stats.retentionRate = totalReviews > 0 ? ((totalCorrect / totalReviews) * 100).toFixed(1) : 0;

        return stats;
    }

    // Calculate current study streak
    calculateStreak(words) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streakDays = 0;
        let checkDate = new Date(today);
        
        // Go back day by day to find the streak
        while (streakDays < 365) { // Max check 1 year
            const dateStr = checkDate.toDateString();
            const hasReviewsOnDate = words.some(word => {
                if (!word.srsData.lastReviewed) return false;
                const reviewDate = new Date(word.srsData.lastReviewed);
                return reviewDate.toDateString() === dateStr;
            });
            
            if (hasReviewsOnDate) {
                streakDays++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streakDays;
    }

    // Get personalized recommendations
    getRecommendations(words, userProgress) {
        const recommendations = [];
        const stats = this.generateStats(words);
        
        // Recommendation: Review overdue words
        const overdue = words.filter(word => {
            const reviewDate = new Date(word.srsData.nextReview);
            const now = new Date();
            return reviewDate < now;
        });
        
        if (overdue.length > 0) {
            recommendations.push({
                type: 'overdue',
                priority: 'high',
                message: `You have ${overdue.length} overdue words. Review them to maintain your progress!`,
                action: 'Review Now',
                words: overdue.slice(0, 10) // Limit to 10 for performance
            });
        }

        // Recommendation: Focus on weak areas
        const weakWords = words.filter(word => {
            const retention = this.calculateRetentionRate(
                word.srsData.correctAnswers, 
                word.srsData.totalReviews
            );
            return retention < 70 && word.srsData.totalReviews >= 3;
        });
        
        if (weakWords.length > 0) {
            recommendations.push({
                type: 'weak_areas',
                priority: 'medium',
                message: `${weakWords.length} words need extra attention. Focus on these to improve retention.`,
                action: 'Practice Weak Words',
                words: weakWords
            });
        }

        // Recommendation: Learn new words
        if (stats.reviewsToday >= 10 && overdue.length === 0) {
            recommendations.push({
                type: 'new_words',
                priority: 'low',
                message: "Great progress today! Ready to learn some new words?",
                action: 'Add New Words'
            });
        }

        // Recommendation: Maintain streak
        if (stats.streakDays >= 3 && stats.reviewsToday === 0) {
            recommendations.push({
                type: 'maintain_streak',
                priority: 'high',
                message: `Don't break your ${stats.streakDays}-day streak! Do a quick review session.`,
                action: 'Quick Review'
            });
        }

        return recommendations;
    }

    // Export session data for analytics
    exportSessionData(sessionWords, sessionResults) {
        const session = {
            date: new Date().toISOString(),
            wordsReviewed: sessionWords.length,
            correctAnswers: sessionResults.filter(r => r.correct).length,
            averageResponseTime: sessionResults.reduce((sum, r) => sum + (r.responseTime || 0), 0) / sessionResults.length,
            difficultyDistribution: {
                difficult: sessionResults.filter(r => r.userRating === 1).length,
                medium: sessionResults.filter(r => r.userRating === 2).length,
                easy: sessionResults.filter(r => r.userRating === 3).length
            },
            sessionDuration: sessionResults.length > 0 ? 
                (new Date(sessionResults[sessionResults.length - 1].timestamp) - 
                 new Date(sessionResults[0].timestamp)) / 1000 : 0
        };

        // Store in localStorage for progress tracking
        const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        sessions.push(session);
        
        // Keep only last 100 sessions
        if (sessions.length > 100) {
            sessions.splice(0, sessions.length - 100);
        }
        
        localStorage.setItem('studySessions', JSON.stringify(sessions));
        return session;
    }
}

// Export for use in other files
window.SRSSystem = SRSSystem;