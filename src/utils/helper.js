// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

module.exports = { formatDate, calculateTotal };