import type { APIRoute } from "astro"
import { getOpenGraphTemplateResponse } from "~/utils/opengraph"

export const GET: APIRoute = async ({ site }) => {
  return await getOpenGraphTemplateResponse(site, {
    title: "Independent software engineer and designer.",
  })
}
