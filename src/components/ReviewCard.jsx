// ✅ ReviewCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import defaultAvatar from '../assets/default-avtar.jpg';

const ReviewCard = ({ review, onDelete }) => {
  return (
    <motion.div
      className="bg-white shadow rounded p-4 border hover:shadow-md transition relative"
      whileHover={{ scale: 1.03 }}
    >
      {onDelete && (
        <button
          onClick={() => onDelete(review)}
          className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-sm bg-white border border-blue-200 rounded px-2 py-1 shadow-sm"
          aria-label="Delete review"
        >
          Delete
        </button>
      )}

      <div className="flex items-center mb-2 gap-3">
        <img
          src={review.avatar && review.avatar.trim() !== '' ? review.avatar : (review.userAvatar || defaultAvatar)}
          alt="avatar"
          className="w-10 h-10 rounded-full"
          onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
        />
        <div>
          <h3 className="font-semibold">{review.name}</h3>
          <p className="text-sm text-gray-500">{review.date ? new Date(review.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</p>
        </div>
      </div>
      <p className="text-gray-700 mt-2">{review.text || review.description}</p>
      <p className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
    </motion.div>
  );
};

export default ReviewCard;