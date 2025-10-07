import { ApiResponse, AxiosJosgen } from "@/lib/axios/axios-josgen";
import { DailyVerse } from "@/types/daily-verse/daily-verse";

export async function getDailyVerse(): Promise<DailyVerse> {
  const response = await AxiosJosgen.get<ApiResponse<DailyVerse>>("/daily-verse/");
  if (!response.data.status) throw new Error(response.data.message || 'Failed to get daily verse');
  return response.data.data;
}
