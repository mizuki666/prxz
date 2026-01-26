export const LoggerStyles = {
    API_REQUEST: 'background: #0057ff; color: white; padding: 2px 6px; border-radius: 3px',
    API_REQUEST_TEXT: 'color: #0057ff',
    
    SUCCESS: 'background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px',
    SUCCESS_TEXT: 'color: #4caf50',
    
    ERROR: 'background: #f44336; color: white; padding: 2px 6px; border-radius: 3px',
    ERROR_TEXT: 'color: #f44336',
    
    WARNING: 'background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px',
    WARNING_TEXT: 'color: #ff9800',
    
    INFO: 'background: #2196f3; color: white; padding: 2px 6px; border-radius: 3px',
    INFO_TEXT: 'color: #2196f3',
    
    // Дополнительные стили для разных типов сообщений
    getStyleForStatus: (status) => {
        switch(status.toLowerCase()) {
            case 'success':
                return {
                    badge: LoggerStyles.SUCCESS,
                    text: LoggerStyles.SUCCESS_TEXT
                };
            case 'error':
                return {
                    badge: LoggerStyles.ERROR,
                    text: LoggerStyles.ERROR_TEXT
                };
            case 'warning':
                return {
                    badge: LoggerStyles.WARNING,
                    text: LoggerStyles.WARNING_TEXT
                };
            case 'info':
                return {
                    badge: LoggerStyles.INFO,
                    text: LoggerStyles.INFO_TEXT
                };
            case 'debug':
                return {
                    badge: 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px',
                    text: 'color: #9c27b0'
                };
            default:
                return {
                    badge: LoggerStyles.INFO,
                    text: LoggerStyles.INFO_TEXT
                };
        }
    }
};