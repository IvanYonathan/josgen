import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";

export interface UploadImageRequest {
    image: File;
    note_id?: number;
}

export interface UploadedImage {
    id: number;
    url: string;
    filename: string;
    size: number;
}

export interface UploadImageResponse {
    image: UploadedImage;
}

export async function uploadImage(data: UploadImageRequest): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('image', data.image);
    if (data.note_id) {
        formData.append('note_id', data.note_id.toString());
    }

    const response = await AxiosJosgen.post<ApiResponse<UploadImageResponse>>(
        '/image/upload',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    if (!response.data.status) throw new Error(response.data.message);
    return response.data.data;
}
