import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api';
import { useAuth } from '../contexts/AuthContext';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications(1, true);
  }, [filter]);

  const fetchNotifications = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        limit: 20
      };
      
      if (filter === 'unread') {
        params.unread_only = 'true';
      }

      const response = await API.get('/notifications', { params });
      const newNotifications = response.data.notifications;
      
      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(pageNum < response.data.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      // Seeker notifications
      case 'job_match':
        return { icon: '💼', color: 'bg-blue-100 text-blue-600' };
      case 'loan_suggestion':
        return { icon: '💰', color: 'bg-green-100 text-green-600' };
      case 'credit_score_update':
        return { icon: '📊', color: 'bg-purple-100 text-purple-600' };
      case 'assessment_assigned':
        return { icon: '📝', color: 'bg-orange-100 text-orange-600' };
      case 'assessment_result':
        return { icon: '🎯', color: 'bg-red-100 text-red-600' };
      // Employer notifications
      case 'job_application_received':
        return { icon: '📋', color: 'bg-indigo-100 text-indigo-600' };
      case 'assessment_started':
        return { icon: '⏱️', color: 'bg-yellow-100 text-yellow-600' };
      case 'assessment_completed':
        return { icon: '✅', color: 'bg-green-100 text-green-600' };
      case 'offer_response':
        return { icon: '💬', color: 'bg-pink-100 text-pink-600' };
      case 'agreement_signed':
        return { icon: '📄', color: 'bg-teal-100 text-teal-600' };
      case 'ai_assessment_complete':
        return { icon: '🤖', color: 'bg-purple-100 text-purple-600' };
      default:
        return { icon: '🔔', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  if (!user || (user.role !== 'seeker' && user.role !== 'provider')) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-500">Notifications are only available for job seekers and employers.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
        <div className="flex space-x-4">
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread
            </button>
          </div>
          
          {/* Mark All Read Button */}
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading && notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
            <p className="mt-2 text-gray-500">You're all caught up! Check back later for new updates.</p>
          </div>
        ) : (
          notifications.map((notification, index) => {
            const iconData = getNotificationIcon(notification.type);
            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow-md border-l-4 ${
                  !notification.is_read ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                } hover:shadow-lg transition-shadow`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-full ${iconData.color}`}>
                        <span className="text-2xl">{iconData.icon}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-lg font-semibold ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          <div className="flex space-x-2">
                            {notification.action_url && (
                              <button
                                onClick={() => handleNotificationClick(notification)}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                              >
                                {notification.action_text || 'View'}
                              </button>
                            )}
                            
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                              >
                                Mark as read
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="px-3 py-2 text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {hasMore && notifications.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;