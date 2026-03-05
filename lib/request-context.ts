import { cache } from 'react';
import { headers } from 'next/headers';

export const getRequestStats = cache(() => {
    return {
        dbQueries: 0,
        sessionChecks: 0,
        startTime: Date.now(),
    };
});

export const incrementDbQuery = () => {
    const stats = getRequestStats();
    stats.dbQueries++;
};

export const incrementSessionCheck = () => {
    const stats = getRequestStats();
    stats.sessionChecks++;
};

export const getRequestId = () => {
    const headerList = headers();
    return headerList.get('x-request-id') || 'unknown';
};
