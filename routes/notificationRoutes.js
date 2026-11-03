const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const { requireAuth } = require('../middleware/auth');

// Get notifications for authenticated user
router.get('/', requireAuth, notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', requireAuth, notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', requireAuth, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', requireAuth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', requireAuth, notificationController.deleteNotification);

module.exports = router;