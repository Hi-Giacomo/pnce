import { ApiResponse } from '../types';
export declare class ApiService {
    private axiosInstance;
    constructor();
    private getAuthHeaders;
    get<T = any>(url: string): Promise<ApiResponse<T>>;
    post<T = any>(url: string, data: any, isFormData?: boolean): Promise<ApiResponse<T>>;
    delete<T = any>(url: string): Promise<ApiResponse<T>>;
}
//# sourceMappingURL=api.service.d.ts.map