import moment from "moment";

export const visualization = (data) => {
    return data.reduce((acc, item) => {
        const date = new Date(item.createdAt).toLocaleDateString(); // Extract date
        const format_date = moment(item.createdAt).format('MMM DD')
        if (!acc[date]) {
            acc[date] = { date, format_date, count: 0 };
        }
        acc[date].count += 1;
        return acc;
    }, {});
};


export const visualizationBooking = (data) => {
    // Initialize an object to keep track of counts by status
    const statusCounts = {
        completed: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        pending: 0
    };

    data.forEach(item => {
        // Determine the status based on the boolean fields and increment the count
        if (item.isCompleted) {
            statusCounts.completed += 1;
        } else if (item.isAccepted) {
            statusCounts.accepted += 1;
        } else if (item.isRejected) {
            statusCounts.rejected += 1;
        } else if (item.isExpired) {
            statusCounts.expired += 1;
        } else {
            statusCounts.pending += 1;
        }
    });

    // Convert the statusCounts object into an array of objects
    const formattedData = Object.keys(statusCounts).map(status => ({
        name: status,
        count: statusCounts[status]
    }));

    return formattedData;
};