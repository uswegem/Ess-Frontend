import React from "react";

import { CheckCircle, Clock, XCircle, Ban, FileText } from "lucide-react";
import { Card, CardContent } from "@mui/material";

const Dashboard = () => {
    // Static summary values (can be replaced with API data later)
    const summary = {
        pendingEmployer: 12,
        pendingFsp: 8,
        active: 25,
        cancelled: 4,
        rejected: 6,
        closed: 15,
    };

    const items = [
        {
            title: "Pending Employer Approval",
            value: summary.pendingEmployer,
            icon: <Clock className="text-yellow-500" size={28} />,
        },
        {
            title: "Pending FSP Approval",
            value: summary.pendingFsp,
            icon: <Clock className="text-orange-500" size={28} />,
        },
        {
            title: "Active Loans",
            value: summary.active,
            icon: <CheckCircle className="text-green-600" size={28} />,
        },
        {
            title: "Cancelled",
            value: summary.cancelled,
            icon: <Ban className="text-gray-500" size={28} />,
        },
        {
            title: "Rejected",
            value: summary.rejected,
            icon: <XCircle className="text-red-500" size={28} />,
        },
        {
            title: "Closed (Fully Repaid)",
            value: summary.closed,
            icon: <FileText className="text-blue-600" size={28} />,
        },
    ];

    return (
        <div className="container mx-auto p-6">
            <h5 className="mb-1">Dashboard</h5>
            <div className="row">
                {items.map((item, idx) => (
                    <div className="col-md-6 col-lg-4 mt-3">
                    <Card key={idx} sx={{boxShadow: 'rgba(17, 17, 26, 0.05) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 0px 8px'}}>
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <p className="text-sm text-gray-500">{item.title}</p>
                                <h3 className="text-2xl font-semibold">{item.value}</h3>
                            </div>
                            {item.icon}
                        </CardContent>
                    </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
