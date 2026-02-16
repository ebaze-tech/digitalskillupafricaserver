export declare const sendRequest: (menteeId: string, mentorId: string) => Promise<any>;
export declare const getIncomingRequests: (mentorId: string) => Promise<any[]>;
export declare const updateRequestStatus: (id: string, status: "pending" | "accepted" | "rejected", mentorId: string) => Promise<any>;
export declare const createMatch: (menteeId: string, mentorId: string) => Promise<any>;
