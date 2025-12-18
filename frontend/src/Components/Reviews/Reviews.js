// src/Components/Reviews/Reviews.js
import React, { useState, useEffect } from 'react';
// Add this import at the top of your Reviews.js file
import './Reviews.css';
import AdminHeader from "../admin/AdminHeader";
import AdminSidebar from "../admin/AdminSidebar";


const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [currentRating, setCurrentRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [activeTab, setActiveTab] = useState('reviews');

    // Load data from localStorage on component mount
    useEffect(() => {
        const savedReviews = JSON.parse(localStorage.getItem('packageReviews')) || [];
        const savedFeedbacks = JSON.parse(localStorage.getItem('packageFeedbacks')) || [];
        
        setReviews(savedReviews);
        setFeedbacks(savedFeedbacks);
        
        // Generate sample data if no reviews exist
        if (savedReviews.length === 0) {
            generateSampleData();
        }
    }, []);

    // Save data to localStorage whenever reviews or feedbacks change
    useEffect(() => {
        localStorage.setItem('packageReviews', JSON.stringify(reviews));
        localStorage.setItem('packageFeedbacks', JSON.stringify(feedbacks));
    }, [reviews, feedbacks]);

    // Available packages
    const packages = [
        { id: '1', name: "Basic Funeral Package", price: "LKR 50,000", category: "standard" },
        { id: '2', name: "Standard Funeral Package", price: "LKR 75,000", category: "standard" },
        { id: '3', name: "Premium Funeral Package", price: "LKR 120,000", category: "premium" },
        { id: '4', name: "VIP Funeral Package", price: "LKR 200,000", category: "premium" },
        { id: '5', name: "Cremation Service Package", price: "LKR 40,000", category: "cremation" },
        { id: '6', name: "Emergency Funeral Service", price: "LKR 90,000", category: "emergency" }
    ];

    // Get package name by ID
    const getPackageName = (packageId) => {
        const pkg = packages.find(p => p.id === packageId);
        return pkg ? pkg.name : "Unknown Package";
    };

    // Email validation
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Star rating handlers
    const handleStarClick = (rating) => {
        setCurrentRating(rating);
    };

    const handleStarHover = (rating) => {
        setHoverRating(rating);
    };

    const handleStarLeave = () => {
        setHoverRating(0);
    };

    // Generate stars display
    const generateStars = (rating, interactive = false) => {
        return Array.from({ length: 5 }, (_, index) => {
            const starValue = index + 1;
            const isActive = starValue <= (interactive ? (hoverRating || currentRating) : rating);
            
            return (
                <i
                    key={index}
                    className={`star ${isActive ? 'fas fa-star active' : 'far fa-star'}`}
                    onClick={interactive ? () => handleStarClick(starValue) : undefined}
                    onMouseEnter={interactive ? () => handleStarHover(starValue) : undefined}
                    onMouseLeave={interactive ? handleStarLeave : undefined}
                />
            );
        });
    };

    // Handle review submission
    const handleReviewSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const review = {
            id: Date.now().toString(),
            packageId: formData.get('packageId'),
            packageName: getPackageName(formData.get('packageId')),
            customerName: formData.get('customerName'),
            email: formData.get('email'),
            rating: currentRating,
            title: formData.get('title'),
            review: formData.get('review'),
            date: new Date().toISOString(),
            verified: Math.random() > 0.3,
            helpful: 0,
            reported: false,
            status: 'published'
        };

        if (!validateReview(review)) {
            return;
        }

        setReviews(prev => [review, ...prev]);
        resetReviewForm();
        showNotification('Review submitted successfully!', 'success');
    };

    // Handle feedback submission
    const handleFeedbackSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const feedback = {
            id: Date.now().toString(),
            packageId: formData.get('packageId'),
            packageName: getPackageName(formData.get('packageId')),
            customerName: formData.get('customerName'),
            email: formData.get('email'),
            feedbackType: formData.get('feedbackType'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            date: new Date().toISOString(),
            status: 'new',
            priority: formData.get('feedbackType') === 'complaint' ? 'high' : 'normal'
        };

        if (!validateFeedback(feedback)) {
            return;
        }

        setFeedbacks(prev => [feedback, ...prev]);
        e.target.reset();
        showNotification('Feedback submitted successfully!', 'success');
    };

    // Validation functions
    const validateReview = (review) => {
        if (!review.packageId) {
            showNotification('Please select a package', 'error');
            return false;
        }
        if (!review.customerName || review.customerName.trim().length < 2) {
            showNotification('Please enter a valid name', 'error');
            return false;
        }
        if (!review.email || !isValidEmail(review.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        if (!review.rating || review.rating < 1 || review.rating > 5) {
            showNotification('Please select a rating', 'error');
            return false;
        }
        if (!review.title || review.title.trim().length < 5) {
            showNotification('Please enter a review title (min 5 characters)', 'error');
            return false;
        }
        if (!review.review || review.review.trim().length < 10) {
            showNotification('Please write a detailed review (min 10 characters)', 'error');
            return false;
        }
        return true;
    };

    const validateFeedback = (feedback) => {
        if (!feedback.packageId) {
            showNotification('Please select a package', 'error');
            return false;
        }
        if (!feedback.customerName || feedback.customerName.trim().length < 2) {
            showNotification('Please enter a valid name', 'error');
            return false;
        }
        if (!feedback.email || !isValidEmail(feedback.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        if (!feedback.feedbackType) {
            showNotification('Please select feedback type', 'error');
            return false;
        }
        if (!feedback.subject || feedback.subject.trim().length < 5) {
            showNotification('Please enter a subject (min 5 characters)', 'error');
            return false;
        }
        if (!feedback.message || feedback.message.trim().length < 10) {
            showNotification('Please write your feedback (min 10 characters)', 'error');
            return false;
        }
        return true;
    };

    // Reset review form
    const resetReviewForm = () => {
        setCurrentRating(0);
        setHoverRating(0);
        const form = document.getElementById('reviewForm');
        if (form) form.reset();
    };

    // Mark review as helpful
    const markHelpful = (reviewId) => {
        setReviews(prev => prev.map(review => 
            review.id === reviewId 
                ? { ...review, helpful: (review.helpful || 0) + 1 }
                : review
        ));
        showNotification('Thank you for your feedback!', 'success');
    };

    // Report review
    const reportReview = (reviewId) => {
        setReviews(prev => prev.map(review => 
            review.id === reviewId 
                ? { ...review, reported: true }
                : review
        ));
        showNotification('Review reported. Our team will review it shortly.', 'info');
    };

    // Show notification
    const showNotification = (message, type = 'info') => {
        alert(`${type.toUpperCase()}: ${message}`);
    };

    // Generate sample data
    const generateSampleData = () => {
        const sampleReviews = [
            {
                id: '1',
                packageId: '3',
                packageName: 'Premium Funeral Package',
                customerName: 'John Silva',
                email: 'john@example.com',
                rating: 5,
                title: 'Exceptional Service During Difficult Times',
                review: 'The Premium package provided everything we needed. The staff was compassionate and professional throughout the entire process.',
                date: new Date('2024-01-15').toISOString(),
                verified: true,
                helpful: 12,
                reported: false,
                status: 'published'
            },
            {
                id: '2',
                packageId: '2',
                packageName: 'Standard Funeral Package',
                customerName: 'Maria Perera',
                email: 'maria@example.com',
                rating: 4,
                title: 'Good Value for Money',
                review: 'The Standard package met our expectations. Everything was well organized and the staff was very supportive.',
                date: new Date('2024-01-10').toISOString(),
                verified: true,
                helpful: 8,
                reported: false,
                status: 'published'
            }
        ];
        setReviews(sampleReviews);
    };

    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Create review card
    const createReviewCard = (review) => {
        const stars = generateStars(review.rating);
        const date = formatDate(review.date);

        return (
            <div key={review.id} className="review-card">
                <div className="review-header">
                    <div className="reviewer-info">
                        <div className="reviewer-avatar">
                            {review.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="reviewer-details">
                            <h4 className="reviewer-name">{review.customerName}</h4>
                            <div className="review-meta">
                                <span className="review-date">{date}</span>
                                {review.verified && (
                                    <span className="verified-badge">
                                        <i className="fas fa-check-circle"></i> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="review-rating">
                        {stars}
                        <span className="rating-value">{review.rating}/5</span>
                    </div>
                </div>
                
                <div className="review-package">
                    <i className="fas fa-box"></i>
                    {review.packageName}
                </div>
                
                <h3 className="review-title">{review.title}</h3>
                <p className="review-content">{review.review}</p>
                
                <div className="review-actions">
                    <button 
                        className="helpful-btn" 
                        onClick={() => markHelpful(review.id)}
                    >
                        <i className="fas fa-thumbs-up"></i>
                        Helpful ({review.helpful || 0})
                    </button>
                    <button 
                        className="report-btn" 
                        onClick={() => reportReview(review.id)}
                    >
                        <i className="fas fa-flag"></i>
                        Report
                    </button>
                </div>
            </div>
        );
    };

    // Create feedback card
    const createFeedbackCard = (feedback) => {
        const date = formatDate(feedback.date);
        const typeIcons = {
            suggestion: 'fas fa-lightbulb',
            complaint: 'fas fa-exclamation-triangle',
            compliment: 'fas fa-heart',
            question: 'fas fa-question-circle'
        };

        const typeColors = {
            suggestion: '#3498db',
            complaint: '#e74c3c',
            compliment: '#2ecc71',
            question: '#f39c12'
        };

        return (
            <div key={feedback.id} className="feedback-card">
                <div className="feedback-header">
                    <div 
                        className="feedback-type" 
                        style={{ background: typeColors[feedback.feedbackType] }}
                    >
                        <i className={typeIcons[feedback.feedbackType]}></i>
                        {feedback.feedbackType.charAt(0).toUpperCase() + feedback.feedbackType.slice(1)}
                    </div>
                    <div className="feedback-meta">
                        <span className="feedback-date">{date}</span>
                        <span className={`feedback-priority ${feedback.priority}`}>
                            {feedback.priority}
                        </span>
                    </div>
                </div>
                
                <div className="feedback-sender">
                    <strong>{feedback.customerName}</strong> ({feedback.email})
                </div>
                
                <div className="feedback-package">
                    <i className="fas fa-box"></i>
                    {feedback.packageName}
                </div>
                
                <h4 className="feedback-subject">{feedback.subject}</h4>
                <p className="feedback-message">{feedback.message}</p>
                
                <div className="feedback-status">
                    <span className={`status-badge ${feedback.status}`}>
                        {feedback.status}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="reviews-container">
            <h1>Reviews & Feedback</h1>
            
            {/* Tabs */}
            <div className="tabs">
                <button 
                    className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    <i className="fas fa-star"></i> Reviews
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                >
                    <i className="fas fa-comments"></i> Feedback
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'write-review' ? 'active' : ''}`}
                    onClick={() => setActiveTab('write-review')}
                >
                    <i className="fas fa-edit"></i> Write Review
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'write-feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('write-feedback')}
                >
                    <i className="fas fa-comment-dots"></i> Give Feedback
                </button>
            </div>

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="tab-content active">
                    <div className="reviews-list">
                        {reviews.length === 0 ? (
                            <div className="no-reviews">
                                <i className="fas fa-comment-slash"></i>
                                <h3>No reviews yet</h3>
                                <p>Be the first to review our packages!</p>
                            </div>
                        ) : (
                            reviews.map(createReviewCard)
                        )}
                    </div>
                </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <div className="tab-content active">
                    <div className="feedback-list">
                        {feedbacks.length === 0 ? (
                            <div className="no-feedback">
                                <i className="fas fa-comments"></i>
                                <h3>No feedback yet</h3>
                                <p>Be the first to share your feedback!</p>
                            </div>
                        ) : (
                            feedbacks.map(createFeedbackCard)
                        )}
                    </div>
                </div>
            )}

            {/* Write Review Tab */}
            {activeTab === 'write-review' && (
                <div className="tab-content active">
                    <form id="reviewForm" onSubmit={handleReviewSubmit} className="review-form">
                        <div className="form-group">
                            <label htmlFor="packageSelect">Select Package *</label>
                            <select id="packageSelect" name="packageId" required>
                                <option value="">Select a package...</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} - {pkg.price}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="customerName">Your Name *</label>
                            <input 
                                type="text" 
                                id="customerName" 
                                name="customerName" 
                                required 
                                minLength="2"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label>Rating *</label>
                            <div className="star-rating">
                                {generateStars(0, true)}
                                <span id="ratingText" className="rating-text">
                                    {currentRating ? `${currentRating}/5` : 'Select Rating'}
                                </span>
                            </div>
                            <input 
                                type="hidden" 
                                id="rating" 
                                name="rating" 
                                value={currentRating} 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="title">Review Title *</label>
                            <input 
                                type="text" 
                                id="title" 
                                name="title" 
                                required 
                                minLength="5"
                                placeholder="Brief summary of your experience"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="review">Your Review *</label>
                            <textarea 
                                id="review" 
                                name="review" 
                                rows="5" 
                                required 
                                minLength="10"
                                placeholder="Share your detailed experience with this package..."
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn">
                            <i className="fas fa-paper-plane"></i> Submit Review
                        </button>
                    </form>
                </div>
            )}

            {/* Write Feedback Tab */}
            {activeTab === 'write-feedback' && (
                <div className="tab-content active">
                    <form id="feedbackForm" onSubmit={handleFeedbackSubmit} className="feedback-form">
                        <div className="form-group">
                            <label htmlFor="feedbackPackageSelect">Select Package *</label>
                            <select id="feedbackPackageSelect" name="packageId" required>
                                <option value="">Select a package...</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="feedbackCustomerName">Your Name *</label>
                            <input 
                                type="text" 
                                id="feedbackCustomerName" 
                                name="customerName" 
                                required 
                                minLength="2"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="feedbackEmail">Email Address *</label>
                            <input 
                                type="email" 
                                id="feedbackEmail" 
                                name="email" 
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="feedbackType">Feedback Type *</label>
                            <select id="feedbackType" name="feedbackType" required>
                                <option value="">Select type...</option>
                                <option value="suggestion">Suggestion</option>
                                <option value="complaint">Complaint</option>
                                <option value="compliment">Compliment</option>
                                <option value="question">Question</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject *</label>
                            <input 
                                type="text" 
                                id="subject" 
                                name="subject" 
                                required 
                                minLength="5"
                                placeholder="Brief subject of your feedback"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Your Feedback *</label>
                            <textarea 
                                id="message" 
                                name="message" 
                                rows="5" 
                                required 
                                minLength="10"
                                placeholder="Share your detailed feedback..."
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn">
                            <i className="fas fa-paper-plane"></i> Submit Feedback
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Reviews;