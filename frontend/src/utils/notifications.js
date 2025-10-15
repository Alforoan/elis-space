// Browser notification utilities for Eli mood tracker

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export const sendNotification = (title, options = {}) => {
  console.log('Attempting to send notification...', { title, permission: Notification.permission })

  if (Notification.permission === 'granted') {
    try {
      const notificationOptions = {
        body: options.body || '',
        vibrate: [200, 100, 200],
        requireInteraction: options.requireInteraction !== undefined ? options.requireInteraction : false,
        tag: options.tag || 'eli-notification',
        ...options
      }

      // Only add icon if explicitly provided
      if (options.icon) {
        notificationOptions.icon = options.icon
      }
      if (options.badge) {
        notificationOptions.badge = options.badge
      }

      const notification = new Notification(title, notificationOptions)

      console.log('Notification created successfully!', notification)

      notification.onclick = () => {
        console.log('Notification clicked!')
        window.focus()
        notification.close()
      }

      notification.onerror = (error) => {
        console.error('Notification error:', error)
      }

      notification.onshow = () => {
        console.log('Notification is showing!')
      }

      notification.onclose = () => {
        console.log('Notification closed')
      }

      // Auto-close after 10 seconds if requireInteraction is false
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 10000)
      }

      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  } else {
    console.warn('Notification permission not granted:', Notification.permission)
  }
  return null
}

export const scheduleDailyReminder = (reminderTime, settings) => {
  const [hours, minutes] = reminderTime.split(':')
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  // If the scheduled time has passed by more than 1 minute, schedule for tomorrow
  // Otherwise schedule for today (allows for times that just passed or are upcoming)
  const timeDiff = scheduledTime - now
  if (timeDiff < -60000) { // More than 1 minute in the past
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const timeUntilReminder = scheduledTime - now

  console.log('Scheduling notification:', {
    reminderTime,
    now: now.toLocaleString(),
    scheduledTime: scheduledTime.toLocaleString(),
    timeUntilReminder: `${Math.floor(timeUntilReminder / 1000 / 60)} minutes (${Math.floor(timeUntilReminder / 1000)} seconds)`,
    permission: Notification.permission
  })

  // If the time is very soon (less than 5 seconds away), send immediately
  if (timeUntilReminder < 5000 && timeUntilReminder > -5000) {
    console.log('Time is very close, sending notification immediately!')
    sendNotification('Time to check in with Eli 💙', {
      body: 'How are you feeling today? Take a moment to reflect and share with Eli.',
      requireInteraction: true,
      tag: 'daily-reminder'
    })

    // Schedule for tomorrow
    const tomorrowTime = new Date()
    tomorrowTime.setDate(tomorrowTime.getDate() + 1)
    tomorrowTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    const timeUntilTomorrow = tomorrowTime - new Date()

    return setTimeout(() => {
      scheduleDailyReminder(reminderTime, settings)
    }, timeUntilTomorrow)
  }

  return setTimeout(() => {
    console.log('Sending scheduled notification now!')
    sendNotification('Time to check in with Eli 💙', {
      body: 'How are you feeling today? Take a moment to reflect and share with Eli.',
      requireInteraction: true,
      tag: 'daily-reminder'
    })

    // Schedule the next reminder for tomorrow
    scheduleDailyReminder(reminderTime, settings)
  }, Math.max(0, timeUntilReminder))
}

// Test notification function - sends immediately
export const sendTestNotification = () => {
  console.log('Sending test notification, permission:', Notification.permission)
  return sendNotification('Test Notification from Eli', {
    body: 'If you see this, notifications are working! 🎉',
    tag: 'test-notification'
  })
}

export const checkNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}
