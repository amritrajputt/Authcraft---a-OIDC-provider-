
class ApiResponse{
    statusCode: number;
    data: any;
    message: string;
    constructor(statusCode: number, data: any, message: string ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
    static success(statusCode:number, data:any, message:string = 'Success'){
        return new ApiResponse(statusCode, data, message);
    }
    static ok(statusCode:number, data:any, message:string = 'OK'){
        return new ApiResponse(statusCode, data, message);
    }
    static created(statusCode:number, data:any, message:string = 'Created'){
        return new ApiResponse(statusCode, data, message);
    }
    static updated(statusCode:number, data:any, message:string = 'Updated'){
        return new ApiResponse(statusCode, data, message);
    }
    static deleted(statusCode:number, data:any, message:string = 'Deleted'){
        return new ApiResponse(statusCode, data, message);
    }
}

export default ApiResponse;