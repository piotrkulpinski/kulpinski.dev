import type { APIRoute } from "astro"
import { getOpenGraphTemplateResponse } from "~/utils/opengraph"

export const GET: APIRoute = async () => {
  return await getOpenGraphTemplateResponse({
    title: "Independent software engineer and designer.",
  })
}
