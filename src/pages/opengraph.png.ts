import type { APIRoute } from "astro"
import { getOpenGraphTemplateResponse } from "~/utils/opengraph"

export const GET: APIRoute = async ({ request }) => {
  return await getOpenGraphTemplateResponse(request, {
    title: "Independent software engineer and designer.",
  })
}
