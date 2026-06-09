class ApiError extends Error{
    statusCode: number;
    error: any[];
    isOperational: boolean;
    constructor(statusCode: number, message: string, error:any[] = []){
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.name = 'ApiError';
        this.isOperational = true;
    }
    static badRequest(message: string, error?:any[]){
        return new ApiError(400, message, error);
    }
    static unauthorized(message: string, error?:any[]){
        return new ApiError(401, message, error);
    }
    static forbidden(message: string, error?:any[]){
        return new ApiError(403, message, error);
    }
    static notFound(message: string, error?:any[]){
        return new ApiError(404, message, error);
    }
    static internalServerError(message: string, error?:any[]){
        return new ApiError(500, message, error);
    }
}

export default ApiError;