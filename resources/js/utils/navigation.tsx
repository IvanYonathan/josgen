import { APPLICATION_BASE_PATHNAME } from "@/configs/application";
import type { To } from "react-router-dom";

export function getFullUrl(url: string | To)
{
  return APPLICATION_BASE_PATHNAME + url
}