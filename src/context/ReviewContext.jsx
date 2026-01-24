import React, { createContext, useContext, useEffect, useState } from 'react';

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Fetch reviews from backend
    fetch('/api/reviews', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setReviews(data.data);
        } else {
          setReviews([]);
        }
      })
      .catch(() => setReviews([]));
  }, []);

  const addReview = async (review) => {
    try {
      // Ensure user reviews have a 'text' field for filtering
      const userReview = { ...review, text: review.description || review.text };
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userReview)
      });
      const result = await res.json();
      const newReview = { ...userReview, ...(result.data || result) };
      setReviews(prev => [newReview, ...prev]);
    } catch {
      // handle error
    }
  };

  const deleteReview = async (review) => {
    try {
      if (!review) return false;
      // Determine type and id
      const type = review.type || (review.productId ? 'Product' : review.accessoryId ? 'Accessory' : 'User');
      const id = review.id || review._id;
      let url = '';
      if (type === 'User') {
        if (!id) return false;
        url = `/api/reviews/user/${id}`;
      } else if (type === 'Product') {
        if (!review.productId || !review._id) return false;
        url = `/api/reviews/product/${review.productId}/${review._id}`;
      } else if (type === 'Accessory') {
        if (!review.accessoryId || !review._id) return false;
        url = `/api/reviews/accessory/${review.accessoryId}/${review._id}`;
      } else return false;

      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const result = await res.json();
      if (res.ok && result.success) {
        // Remove from local state (match by id or _id)
        setReviews(prev => prev.filter(r => {
          const rid = r.id || r._id || r._id;
          return !(rid && id && rid.toString() === id.toString());
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };


  return (
    <ReviewContext.Provider value={{ reviews, addReview, deleteReview }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => useContext(ReviewContext);