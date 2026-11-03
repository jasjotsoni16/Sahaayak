const NotificationService = require('../services/notificationService');

// Get notifications for the authenticated user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unread_only === 'true';

    const result = await NotificationService.getUserNotifications(userId, page, limit, unreadOnly);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await NotificationService.getUnreadCount(userId);
    
    res.json({ unread_count: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await NotificationService.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await NotificationService.markAllAsRead(userId);
    
    res.json({ 
      message: 'All notifications marked as read', 
      modified_count: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await NotificationService.deleteNotification(notificationId, userId);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};