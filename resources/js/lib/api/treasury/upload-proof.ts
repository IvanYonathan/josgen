import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export interface UploadAttachmentParams {
    treasury_request_id: number;
    file: File;
}

export interface AttachmentInfo {
    filename: string;
    original_name: string;
    path: string;
    type: string;
    size: number;
    url: string;
}

export interface UploadAttachmentResponse {
    attachment: AttachmentInfo;
}

export async function uploadTreasuryAttachment(params: UploadAttachmentParams): Promise<UploadAttachmentResponse> {
    const formData = new FormData();
    formData.append('treasury_request_id', params.treasury_request_id.toString());
    formData.append('file', params.file);

    const response = await AxiosJosgen.post<ApiResponse<UploadAttachmentResponse>>('/treasury/attachment/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}

export async function deleteTreasuryAttachment(treasuryRequestId: number): Promise<void> {
    const response = await AxiosJosgen.post<ApiResponse<null>>('/treasury/attachment/delete', { treasury_request_id: treasuryRequestId });
    if (!response.data.status) throw new Error(response.data.message);
}
